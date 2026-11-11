import httpx
import pandas as pd

async def fetch_nasa_power(lat: float, lon: float, start: str, end: str) -> pd.DataFrame:
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    
    params = {
        "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M,WS2M",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": start,
        "end": end,
        "format": "JSON",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
    
    COLUMN_MAP = {
        "T2M": "t2m_c",
        "T2M_MAX": "t2m_max_c",
        "T2M_MIN": "t2m_min_c",
        "PRECTOTCORR": "precip_mm",
        "ALLSKY_SFC_SW_DWN": "solar_mj",
        "RH2M": "humidity_pct",
        "WS2M": "wind_speed_ms",
    }

    df = pd.DataFrame(data["properties"]["parameter"])
    df = df.rename(columns=COLUMN_MAP)
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.index.name = "date"
    df.replace(-999, pd.NA, inplace=True)
    
    
    
    df.to_csv(f"nasa_power_{lat}_{lon}_{start}_{end}.csv", index=True)
    
    
    return df

if __name__ == "__main__":
    import asyncio

    lat, lon = 35.0, -120.0
    start, end = "20220101", "20221231"

    df = asyncio.run(fetch_nasa_power(lat, lon, start, end))
    print(df.head())
