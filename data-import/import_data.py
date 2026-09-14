import os
import pandas as pd
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
FILE_PATH = "mdds_villages.xlsx"

BATCH_SIZE = 5000


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def main():
    print("Reading MDDS dataset...")

    df = pd.read_excel(
        FILE_PATH,
        sheet_name="allVillagesofIndia",
        header=1,
        engine="openpyxl"
    )

    print(f"Total records loaded: {len(df):,}")

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # -------------------------------------------------
        # 1. COUNTRY
        # -------------------------------------------------
        print("\nPreparing Country...")

        cursor.execute(
            """
            INSERT INTO "Country"
                ("name", "code", "createdAt", "updatedAt")
            VALUES (%s, %s, NOW(), NOW())
            ON CONFLICT ("code") DO NOTHING
            RETURNING "id";
            """,
            ("India", "IN")
        )

        result = cursor.fetchone()

        if result:
            country_id = result[0]
        else:
            cursor.execute(
                'SELECT "id" FROM "Country" WHERE "code" = %s',
                ("IN",)
            )
            country_id = cursor.fetchone()[0]

        print(f"Country ready: India (ID: {country_id})")

        # -------------------------------------------------
        # 2. STATES
        # -------------------------------------------------
        print("\nPreparing States...")

        states = (
            df[
                ["State Code", "State Name (In English)"]
            ]
            .drop_duplicates()
            .itertuples(index=False, name=None)
        )

        state_values = []

        for state_code, state_name in states:
            state_values.append(
                (
                    str(state_code).strip(),
                    str(state_name).strip(),
                    country_id
                )
            )

        execute_values(
            cursor,
            """
            INSERT INTO "State"
                ("code", "name", "countryId", "createdAt", "updatedAt")
            VALUES %s
            ON CONFLICT ("code") DO NOTHING
            """,
            state_values,
            template="(%s, %s, %s, NOW(), NOW())"
        )

        cursor.execute(
            'SELECT "id", "code" FROM "State" WHERE "countryId" = %s',
            (country_id,)
        )

        state_ids = {
            str(code): state_id
            for state_id, code in cursor.fetchall()
        }

        print(f"States ready: {len(state_ids)}")

        # -------------------------------------------------
        # 3. DISTRICTS
        # -------------------------------------------------
        print("\nPreparing Districts...")

        district_df = df[
            [
                "State Code",
                "District Code",
                "District Name (In English)"
            ]
        ].drop_duplicates(
            ["State Code", "District Code"]
        )

        district_values = []

        for _, row in district_df.iterrows():
            state_code = str(row["State Code"]).strip()
            district_code = str(row["District Code"]).strip()
            district_name = str(
                row["District Name (In English)"]
            ).strip()

            district_values.append(
                (
                    district_code,
                    district_name,
                    state_ids[state_code]
                )
            )

        execute_values(
            cursor,
            """
            INSERT INTO "District"
                ("code", "name", "stateId", "createdAt", "updatedAt")
            VALUES %s
            ON CONFLICT ("code") DO NOTHING
            """,
            district_values,
            template="(%s, %s, %s, NOW(), NOW())"
        )

        cursor.execute(
            'SELECT "id", "code", "stateId" FROM "District"'
        )

        district_ids = {
            (str(code), state_id): district_id
            for district_id, code, state_id in cursor.fetchall()
        }

        print(f"Districts ready: {len(district_ids)}")

        # -------------------------------------------------
        # 4. SUB-DISTRICTS
        # -------------------------------------------------
        print("\nPreparing Sub-Districts...")

        subdistrict_df = df[
            [
                "State Code",
                "District Code",
                "Sub-District Code",
                "Sub-District Name (In English)"
            ]
        ].drop_duplicates(
            [
                "State Code",
                "District Code",
                "Sub-District Code"
            ]
        )

        subdistrict_values = []

        for _, row in subdistrict_df.iterrows():
            state_code = str(row["State Code"]).strip()
            district_code = str(row["District Code"]).strip()
            subdistrict_code = str(
                row["Sub-District Code"]
            ).strip()

            subdistrict_name = str(
                row["Sub-District Name (In English)"]
            ).strip()

            state_id = state_ids[state_code]

            district_id = district_ids[
                (district_code, state_id)
            ]

            subdistrict_values.append(
                (
                    subdistrict_code,
                    subdistrict_name,
                    district_id
                )
            )

        execute_values(
            cursor,
            """
            INSERT INTO "SubDistrict"
                ("code", "name", "districtId", "createdAt", "updatedAt")
            VALUES %s
            ON CONFLICT ("code") DO NOTHING
            """,
            subdistrict_values,
            template="(%s, %s, %s, NOW(), NOW())"
        )

        cursor.execute(
            'SELECT "id", "code", "districtId" FROM "SubDistrict"'
        )

        subdistrict_ids = {
            (str(code), district_id): subdistrict_id
            for subdistrict_id, code, district_id
            in cursor.fetchall()
        }

        print(f"Sub-Districts ready: {len(subdistrict_ids)}")

        # -------------------------------------------------
        # 5. VILLAGES - BATCH IMPORT
        # -------------------------------------------------
        print("\nImporting Villages...")

        total_rows = len(df)
        processed = 0

        for start in range(0, total_rows, BATCH_SIZE):

            batch = df.iloc[start:start + BATCH_SIZE]

            village_values = []

            for _, row in batch.iterrows():

                state_code = str(row["State Code"]).strip()
                district_code = str(
                    row["District Code"]
                ).strip()

                subdistrict_code = str(
                    row["Sub-District Code"]
                ).strip()

                village_code = str(
                    row["Village Code"]
                ).strip()

                village_name = str(
                    row["Village Name (In English)"]
                ).strip()

                state_id = state_ids[state_code]

                district_id = district_ids[
                    (district_code, state_id)
                ]

                subdistrict_id = subdistrict_ids[
                    (subdistrict_code, district_id)
                ]

                village_values.append(
                    (
                        village_code,
                        village_name,
                        subdistrict_id
                    )
                )

            execute_values(
                cursor,
                """
                INSERT INTO "Village"
                    ("code", "name", "subDistrictId",
                     "createdAt", "updatedAt")
                VALUES %s
                ON CONFLICT ("code") DO NOTHING
                """,
                village_values,
                template="(%s, %s, %s, NOW(), NOW())"
            )

            processed += len(batch)

            print(
                f"Progress: {processed:,} / "
                f"{total_rows:,} villages"
            )

        # -------------------------------------------------
        # 6. COMMIT
        # -------------------------------------------------
        conn.commit()

        print("\n========================================")
        print("       FULL IMPORT SUCCESS")
        print("========================================")
        print(f"Total villages processed: {processed:,}")
        print("Database transaction committed successfully.")

    except Exception as error:

        conn.rollback()

        print("\n========================================")
        print("             IMPORT FAILED")
        print("========================================")
        print(error)
        print("All changes from this transaction were rolled back.")

    finally:

        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()