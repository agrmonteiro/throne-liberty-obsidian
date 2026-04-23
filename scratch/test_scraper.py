import sys
import os
from pathlib import Path

# Adiciona o diretório scripts ao path para poder importar o catalog_scraper
sys.path.append(str(Path(__file__).resolve().parent.parent / "scripts"))

from catalog_scraper import scrape_skill_detail, sync_playwright

def test_skill():
    skill_id = "SkillSet_WP_SW_SH_S_BuffAttack"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            locale="en-US",
        )
        page = ctx.new_page()
        page.set_default_timeout(20000)
        
        print(f"Scraping skill: {skill_id}...")
        detail = scrape_skill_detail(page, skill_id)
        
        if detail:
            print("\n--- RESULTS ---")
            print(f"ID: {detail.get('id')}")
            print(f"Name (EN): {detail.get('nameEn')}")
            print(f"Name (PT): {detail.get('namePt')}")
            print(f"Cooldown: {detail.get('cooldownSec')}s")
            print(f"Mana Cost: {detail.get('manaCost')}")
            print(f"Skill Type (EN): {detail.get('skillTypeEn')}")
            print(f"Skill Type (PT): {detail.get('skillTypePt')}")
            print(f"Use Format (EN): {detail.get('useFormatEn')}")
            print(f"Use Format (PT): {detail.get('useFormatPt')}")
            print("\nDescription (EN):")
            print(detail.get('descriptionEn'))
            print("\nDescription (PT):")
            print(detail.get('descriptionPt'))
        else:
            print("Failed to scrape skill.")
            
        # Debug: salva o texto das páginas para análise
        for locale in ["en", "pt"]:
            url = f"https://questlog.gg/throne-and-liberty/{locale}/db/skill-set/{skill_id}?level=15"
            page.goto(url)
            page.wait_for_selector("main")
            Path(f"scratch/debug_text_{locale}.txt").write_text(page.inner_text("main"), encoding="utf-8")
        
        browser.close()


if __name__ == "__main__":
    test_skill()
