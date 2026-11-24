#!/usr/bin/env python3
"""Generate lifelike Neural TTS audio files (zh-TW & en-US) for the 10 NKUHT HTL faculty members.

Male teachers use Taiwan Mandarin Neural male voice (zh-TW-YunJheNeural) and US English Neural male voices.
Female teachers use Taiwan Mandarin Neural female voices (zh-TW-HsiaoChenNeural / zh-TW-HsiaoYuNeural) and US English Neural female voices.
"""
import asyncio
from pathlib import Path
import edge_tts

OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "voices"

TEACHERS = [
    {
        "id": "hsieh-wc",
        "name": "謝文欽",
        "gender": "male",
        "voice_zh": "zh-TW-YunJheNeural",
        "rate_zh": "+0%",
        "pitch_zh": "-2Hz",
        "text_zh": "大家好，我是國立高雄餐旅大學旅館管理系副教授兼系主任兼學務長，謝文欽。我的專長領域為旅館服務業管理、旅館行銷管理與賭場管理。歡迎來到高餐大旅館管理系 3D 學習與職涯導覽島，和我們一起認識本系的課程、校外實習與菁英實習計畫三點零！",
        "voice_en": "en-US-AndrewNeural",
        "rate_en": "+0%",
        "pitch_en": "+0Hz",
        "text_en": "Hello everyone! I am Wen-Chin Hsieh, Associate Professor, Department Chair, and Dean of Student Affairs in the Department of Hotel Management at NKUHT. My expertise covers hotel service management, hotel marketing management, and casino management. Welcome to our 3D Hotel Management Island!",
    },
    {
        "id": "yang-jt",
        "name": "楊仁德",
        "gender": "male",
        "voice_zh": "zh-TW-YunJheNeural",
        "rate_zh": "-4%",
        "pitch_zh": "-5Hz",
        "text_zh": "同學好，我是旅館管理系專任教授，楊仁德。我的專長涵蓋知識經濟與管理、管理心理學、組織行為、策略管理與服務業管理；在系上授課領域包含客房管理、餐飲管理、旅館管家實務、服務中心實務與客房營收管理，陪伴大家奠定扎實的理論與實務基礎。",
        "voice_en": "en-US-ChristopherNeural",
        "rate_en": "-2%",
        "pitch_en": "-2Hz",
        "text_en": "Greetings! I am Professor Jen-Te Yang in the Department of Hotel Management. My expertise spans knowledge economy, managerial psychology, organizational behavior, strategic management, and service management, teaching rooms management, food and beverage management, and butler practice.",
    },
    {
        "id": "sha-c",
        "name": "沙荃",
        "gender": "male",
        "voice_zh": "zh-TW-YunJheNeural",
        "rate_zh": "+3%",
        "pitch_zh": "+1Hz",
        "text_zh": "大家好，我是旅館管理系助理教授級專技人員，沙全。我的專長為旅館管理、人力資源與組織行為，曾擔任旅館客房服務技術士技能檢定監評，並指導全國技能競賽旅館接待選手，歡迎同學一起挑戰自我、精進旅宿專業！",
        "voice_en": "en-US-EricNeural",
        "rate_en": "+2%",
        "pitch_en": "+0Hz",
        "text_en": "Hello! I am Dr. Roger Sha, Assistant Professor (Specialist Track) in the Department of Hotel Management. My specialties include hotel management, human resources, and organizational behavior, and I coach hotel reception contestants for the National Skills Competition.",
    },
    {
        "id": "hsieh-jl",
        "name": "謝家黎",
        "gender": "female",
        "voice_zh": "zh-TW-HsiaoChenNeural",
        "rate_zh": "-1%",
        "pitch_zh": "-1Hz",
        "text_zh": "大家好，我是旅館管理系專任副教授，謝家黎。我的專長領域為人力資源管理、客務實務與國際禮儀，歡迎大家在旅館島上認識國際禮儀與客務實務。",
        "voice_en": "en-US-AvaNeural",
        "rate_en": "+0%",
        "pitch_en": "+0Hz",
        "text_en": "Hello everyone! I am Associate Professor Amber Hsieh in the Department of Hotel Management. I specialize in human resource management, front office practice, and international etiquette.",
    },
    {
        "id": "huang-cy",
        "name": "黃啟揚",
        "gender": "male",
        "voice_zh": "zh-TW-YunJheNeural",
        "rate_zh": "+2%",
        "pitch_zh": "+2Hz",
        "text_zh": "嗨，大家好！我是旅館管理系專任助理教授，黃啟揚。我的專長是旅館資訊管理、旅館行銷管理與餐廳管理，歡迎跟著我一起認識這些領域！",
        "voice_en": "en-US-BrianNeural",
        "rate_en": "+2%",
        "pitch_en": "+1Hz",
        "text_en": "Hi everyone! I am Assistant Professor Chi-Yang Huang in the Department of Hotel Management. My expertise covers hotel information management, hotel marketing management, and restaurant management.",
    },
    {
        "id": "yu-mf",
        "name": "游明鳳",
        "gender": "female",
        "voice_zh": "zh-TW-HsiaoYuNeural",
        "rate_zh": "+0%",
        "pitch_zh": "-2Hz",
        "text_zh": "各位同學好，我是旅館管理系專任助理教授，游明鳳。我的專長領域為旅館採購與旅館財務管理，歡迎同學一起認識旅館的採購與財務管理。",
        "voice_en": "en-US-AriaNeural",
        "rate_en": "+0%",
        "pitch_en": "+0Hz",
        "text_en": "Hello students! I am Assistant Professor Sally Yu in the Department of Hotel Management. I specialize in hotel purchasing and hotel financial management.",
    },
    {
        "id": "hsieh-cl",
        "name": "謝金龍",
        "gender": "male",
        "voice_zh": "zh-TW-YunJheNeural",
        "rate_zh": "+1%",
        "pitch_zh": "-3Hz",
        "text_zh": "大家好，我是旅館管理系助理教授兼實習輔導組長，謝金龍。我的專長是旅館客務管理與旅館行銷管理。第三學年的校外實習，以及菁英實習計畫三點零的二十四家合作旅館，歡迎同學一起了解！",
        "voice_en": "en-US-SteffanNeural",
        "rate_en": "+0%",
        "pitch_en": "-1Hz",
        "text_en": "Hello! I am Assistant Professor Benson Hsieh, Head of Internship Guidance in the Department of Hotel Management. My specialties are hotel front office management and hotel marketing, supporting students across our 24 Elite Internship 3.0 partner hotels.",
    },
    {
        "id": "hsu-mj",
        "name": "許孟鈞",
        "gender": "male",
        "voice_zh": "zh-TW-YunJheNeural",
        "rate_zh": "+4%",
        "pitch_zh": "+3Hz",
        "text_zh": "大家好，我是旅館管理系助理教授兼校務策略研究組長，許孟鈞。我的專長涵蓋雲端科技應用、資訊管理、知識管理、電子商務、餐旅資訊系統與數位行銷。歡迎大家在 3D 旅館島中體驗智慧旅宿科技與 OPERA、德安資訊系統的整合應用！",
        "voice_en": "en-US-RogerNeural",
        "rate_en": "+2%",
        "pitch_en": "+1Hz",
        "text_en": "Hello everyone! I am Dr. Jacques Hsu, Assistant Professor and Head of Institutional Strategy Research. My expertise spans cloud technology, information management, e-commerce, hospitality information systems, and digital marketing.",
    },
    {
        "id": "chang-hc",
        "name": "張慧貞",
        "gender": "female",
        "voice_zh": "zh-TW-HsiaoChenNeural",
        "rate_zh": "+2%",
        "pitch_zh": "+2Hz",
        "text_zh": "同學好，我是旅館管理系專案助理教授，張慧貞。我的專長包括旅館會計學、旅館財務管理、會議管理與客務實務，很高興在旅館島上與大家見面！",
        "voice_en": "en-US-JennyNeural",
        "rate_en": "+0%",
        "pitch_en": "+1Hz",
        "text_en": "Hello! I am Project Assistant Professor Winnie Chang in the Department of Hotel Management. My expertise includes hotel accounting, financial management, meeting management, and front office practice.",
    },
    {
        "id": "lo-sk",
        "name": "盧小琴",
        "gender": "female",
        "voice_zh": "zh-TW-HsiaoYuNeural",
        "rate_zh": "+2%",
        "pitch_zh": "+2Hz",
        "text_zh": "大家好，我是旅館管理系專案助理教授，盧小琴。我的研究與教學專長涵蓋餐飲管理、消費者行為、觀光發展、餐旅教育與餐旅產業管理，歡迎同學一起認識餐旅產業！",
        "voice_en": "en-US-EmmaNeural",
        "rate_en": "+0%",
        "pitch_en": "+0Hz",
        "text_en": "Hello everyone! I am Dr. Jamie Lo, Project Assistant Professor in the Department of Hotel Management. My expertise covers food and beverage management, consumer behavior, tourism development, hospitality education, and hospitality industry management.",
    },
]


async def save_one_file(text: str, voice: str, out_path: Path):
    comm = edge_tts.Communicate(text, voice)
    await comm.save(str(out_path))


def main():
    import subprocess
    import sys
    import time

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if len(sys.argv) == 3:
        tid, lang = sys.argv[1], sys.argv[2]
        t = next(x for x in TEACHERS if x["id"] == tid)
        out_path = OUT_DIR / f"{tid}-{lang}.mp3"
        asyncio.run(save_one_file(t[f"text_{lang}"], t[f"voice_{lang}"], out_path))
        return

    for t in TEACHERS:
        for lang in ("zh", "en"):
            out_path = OUT_DIR / f"{t['id']}-{lang}.mp3"
            if out_path.exists() and out_path.stat().st_size > 5000:
                print(f"  ✓ [skip existing] {out_path.name} ({out_path.stat().st_size} B)")
                continue
            for attempt in range(5):
                r = subprocess.run([sys.executable, "-X", "utf8", __file__, t["id"], lang])
                if r.returncode == 0 and out_path.exists() and out_path.stat().st_size > 5000:
                    print(f"  ✓ {out_path.name} ({out_path.stat().st_size} B, {t[f'voice_{lang}']})")
                    break
                time.sleep(2 * (attempt + 1))
            else:
                raise RuntimeError(f"Failed to synthesize {out_path.name}")


if __name__ == "__main__":
    main()
