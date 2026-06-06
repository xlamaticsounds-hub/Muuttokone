#!/usr/bin/env python3
"""
OPTIMOITU HINNOITTELU - Kannattavuusanalyysi & Investoijille
"""

import json
from datetime import datetime

class OptimizedPricingAnalysis:
    """Vertaa nykyistä vs. optimoitua hinnoittelua"""
    
    def __init__(self):
        self.current_costs = {
            'driver_hourly': 35,
            'vehicle_hourly': 25,
            'crew_member': 30,
            'admin_per_move': 15,
            'marketing_percent': 0.08,
        }
        
        self.analysis = []
    
    def compare_pricing(self, name, revenue_current, revenue_optimized, labor_hours, revenue_percent_change=None):
        """Vertaa hinnoitteluja"""
        
        # Kustannukset
        driver_cost = labor_hours * self.current_costs['driver_hourly']
        vehicle_cost = labor_hours * self.current_costs['vehicle_hourly']
        crew_cost = labor_hours * 2 * self.current_costs['crew_member']
        admin = self.current_costs['admin_per_move']
        
        marketing_current = revenue_current * self.current_costs['marketing_percent']
        marketing_optimized = revenue_optimized * self.current_costs['marketing_percent']
        
        total_cost_base = driver_cost + vehicle_cost + crew_cost + admin
        
        profit_current = revenue_current - (total_cost_base + marketing_current)
        profit_optimized = revenue_optimized - (total_cost_base + marketing_optimized)
        
        margin_current = (profit_current / revenue_current * 100) if revenue_current > 0 else 0
        margin_optimized = (profit_optimized / revenue_optimized * 100) if revenue_optimized > 0 else 0
        
        improvement = profit_optimized - profit_current
        improvement_percent = (improvement / abs(profit_current) * 100) if profit_current != 0 else 0
        
        return {
            'name': name,
            'revenue_current': revenue_current,
            'revenue_optimized': revenue_optimized,
            'revenue_change': revenue_optimized - revenue_current,
            'revenue_change_percent': revenue_percent_change,
            'labor_hours': labor_hours,
            'total_costs': total_cost_base + marketing_current,
            'profit_current': profit_current,
            'profit_optimized': profit_optimized,
            'profit_improvement': improvement,
            'margin_current': margin_current,
            'margin_optimized': margin_optimized,
        }


def print_analysis():
    print("=" * 90)
    print("MUUTTOKONE.FI - OPTIMOITU HINNOITTELU & KANNATTAVUUSANALYYSI")
    print("=" * 90)
    print()
    
    analyzer = OptimizedPricingAnalysis()
    
    # SKENARIO 1: Pieni muutto
    print("📊 SKENARIO 1: PIENI MUUTTO (1h, 10km)")
    print("-" * 90)
    print("\n🔴 NYKYINEN HINNOITTELU:")
    print("  Hinta asiakkaalle: €428,85")
    print("  Työtunnit: 3,5h")
    print("  Voitto: -€40,46 (-9,4%)")
    print("  ONGELMA: Hinta alle vähimmäismaksun, VAARALLINEN!")
    
    print("\n✅ OPTIMOITU HINNOITTELU:")
    print("  Suositeltu hinta: €699 (perustuu todellisiin kustannuksiin)")
    print("  Perustelu:")
    print("    • Kuljettaja: €122,50")
    print("    • Ajoneuvo: €87,50")
    print("    • 2 kantajaa: €210")
    print("    • Admin: €15")
    print("    • Markkinointi (8%): €55,92")
    print("    • Tavoitevoittomarginaali (20%): €139,80")
    print("  Voitto: €139,80 (20%)")
    
    result1 = analyzer.compare_pricing(
        'Pieni muutto',
        428.85,
        699,
        3.5,
        revenue_percent_change=63.0
    )
    
    print("\n💰 VERTAILU:")
    print(f"  Hintaero: +€{result1['revenue_change']:.2f} ({result1['revenue_change_percent']:.1f}%)")
    print(f"  Voittoparannus: +€{result1['profit_improvement']:.2f}")
    print(f"  Marginaali: {result1['margin_current']:.1f}% → {result1['margin_optimized']:.1f}%")
    print()
    
    # SKENARIO 2: Keskikokoinen muutto
    print("📊 SKENARIO 2: KESKIKOKOINEN MUUTTO (2h, 30km, portaikko)")
    print("-" * 90)
    print("\n🟡 NYKYINEN HINNOITTELU:")
    print("  Hinta asiakkaalle: €1000,65")
    print("  Työtunnit: 7h")
    print("  Voitto: €65,60 (6,6%)")
    print("  ONGELMA: Liian matala marginaali (tavoite 20-25%)")
    
    print("\n✅ OPTIMOITU HINNOITTELU:")
    print("  Suositeltu hinta: €1299 (20% voittomarginaali)")
    print("  Perustelu:")
    print("    • Kuljettaja: €245")
    print("    • Ajoneuvo: €175")
    print("    • 2 kantajaa: €420")
    print("    • Admin: €15")
    print("    • Markkinointi (8%): €103,92")
    print("    • Tavoitevoittomarginaali (20%): €259,80")
    print("  Voitto: €259,80 (20%)")
    
    result2 = analyzer.compare_pricing(
        'Keskikokoinen muutto',
        1000.65,
        1299,
        7.0,
        revenue_percent_change=29.8
    )
    
    print("\n💰 VERTAILU:")
    print(f"  Hintaero: +€{result2['revenue_change']:.2f} ({result2['revenue_change_percent']:.1f}%)")
    print(f"  Voittoparannus: +€{result2['profit_improvement']:.2f}")
    print(f"  Marginaali: {result2['margin_current']:.1f}% → {result2['margin_optimized']:.1f}%")
    print()
    
    # SKENARIO 3: Suuri muutto
    print("📊 SKENARIO 3: SUURI MUUTTO (3h, 50km, pakkaus)")
    print("-" * 90)
    print("\n🔴 NYKYINEN HINNOITTELU:")
    print("  Hinta asiakkaalle: €1652,45")
    print("  Työtunnit: 13,5h")
    print("  Voitto: -€114,75 (-6,9%)")
    print("  ONGELMA: NEGATIIVINEN VOITTO! TAPPIOLLINEN!")
    
    print("\n✅ OPTIMOITU HINNOITTELU:")
    print("  Suositeltu hinta: €2399 (20% voittomarginaali)")
    print("  Perustelu:")
    print("    • Kuljettaja: €472,50")
    print("    • Ajoneuvo: €337,50")
    print("    • 2 kantajaa: €810")
    print("    • Admin: €15")
    print("    • Markkinointi (8%): €191,92")
    print("    • Tavoitevoittomarginaali (20%): €479,80")
    print("  Voitto: €479,80 (20%)")
    
    result3 = analyzer.compare_pricing(
        'Suuri muutto',
        1652.45,
        2399,
        13.5,
        revenue_percent_change=45.1
    )
    
    print("\n💰 VERTAILU:")
    print(f"  Hintaero: +€{result3['revenue_change']:.2f} ({result3['revenue_change_percent']:.1f}%)")
    print(f"  Voittoparannus: +€{result3['profit_improvement']:.2f}")
    print(f"  Marginaali: {result3['margin_current']:.1f}% → {result3['margin_optimized']:.1f}%")
    print()
    
    # SKENARIO 4: Yritysmuutto
    print("📊 SKENARIO 4: YRITYSMUUTTO (toimisto, 25km, kompleksi)")
    print("-" * 90)
    print("\n🟡 NYKYINEN HINNOITTELU:")
    print("  Hinta asiakkaalle: €2187,70")
    print("  Työtunnit: 15,5h")
    print("  Voitto: €137,68 (6,3%)")
    print("  ONGELMA: Liian matala marginaali, ei jää kehitykselle")
    
    print("\n✅ OPTIMOITU HINNOITTELU:")
    print("  Suositeltu hinta: €3249 (20% voittomarginaali)")
    print("  Perustelu:")
    print("    • Kuljettaja: €542,50")
    print("    • Ajoneuvo: €387,50")
    print("    • 2 kantajaa: €930")
    print("    • Admin: €15")
    print("    • Markkinointi (8%): €259,92")
    print("    • Tavoitevoittomarginaali (20%): €649,80")
    print("  Voitto: €649,80 (20%)")
    
    result4 = analyzer.compare_pricing(
        'Yritysmuutto',
        2187.70,
        3249,
        15.5,
        revenue_percent_change=48.6
    )
    
    print("\n💰 VERTAILU:")
    print(f"  Hintaero: +€{result4['revenue_change']:.2f} ({result4['revenue_change_percent']:.1f}%)")
    print(f"  Voittoparannus: +€{result4['profit_improvement']:.2f}")
    print(f"  Marginaali: {result4['margin_current']:.1f}% → {result4['margin_optimized']:.1f}%")
    print()
    
    # YHTEENVETO
    print("=" * 90)
    print("YHTEENVETO - VUOSITUOTTO ANALYYSI (260 muuttoa/vuosi)")
    print("=" * 90)
    print()
    
    results = [result1, result2, result3, result4]
    avg_current = sum(r['revenue_current'] for r in results) / len(results)
    avg_optimized = sum(r['revenue_optimized'] for r in results) / len(results)
    
    avg_profit_current = sum(r['profit_current'] for r in results) / len(results)
    avg_profit_optimized = sum(r['profit_optimized'] for r in results) / len(results)
    
    annual_revenue_current = avg_current * 260
    annual_revenue_optimized = avg_optimized * 260
    annual_profit_current = avg_profit_current * 260
    annual_profit_optimized = avg_profit_optimized * 260
    
    print("NYKYINEN HINNOITTELU:")
    print(f"  Keskim. hinta per muutto: €{avg_current:,.2f}")
    print(f"  Keskim. voitto per muutto: €{avg_profit_current:,.2f}")
    print(f"  Vuosituotto (260 muuttoa): €{annual_revenue_current:,.2f}")
    print(f"  Vuosituotto (voitot): €{annual_profit_current:,.2f}")
    print()
    
    print("OPTIMOITU HINNOITTELU:")
    print(f"  Keskim. hinta per muutto: €{avg_optimized:,.2f}")
    print(f"  Keskim. voitto per muutto: €{avg_profit_optimized:,.2f}")
    print(f"  Vuosituotto (260 muuttoa): €{annual_revenue_optimized:,.2f}")
    print(f"  Vuosituotto (voitot): €{annual_profit_optimized:,.2f}")
    print()
    
    improvement = annual_profit_optimized - annual_profit_current
    print("🚀 PARANNUS:")
    print(f"  Lisätulo per muutto: €{avg_optimized - avg_current:,.2f}")
    print(f"  Lisävoitto per muutto: €{avg_profit_optimized - avg_profit_current:,.2f}")
    print(f"  Vuosittainen lisävoitto: €{improvement:,.2f}")
    print()
    
    # Markkinointianalyysi
    print("=" * 90)
    print("KILPAILUANALYYSI - MARKKINAPOSITIO")
    print("=" * 90)
    print()
    print("NYKYINEN ASEMA:")
    print("  • Liian matala hinnoittelu")
    print("  • Kilpailussa alempi hinta, mutta kannattamattomuus")
    print("  • Ei voittoja kehitykselle")
    print()
    
    print("OPTIMOITU ASEMA:")
    print("  • Realistinen hinnoittelu kustannuksiin nähden")
    print("  • 20% voittomarginaali = alan standardi (muuttopalvelut)")
    print("  • Mahdollistaa:")
    print("    - Palvelulaadun parantamisen")
    print("    - Palkkojen nousu (motivaatio)")
    print("    - Markkinointiin investointi")
    print("    - Teknologia & automatisointi")
    print()
    
    # Asiakasarvon ehdotus
    print("ASIAKKAALLE MYYTÄVÄ ARVO:")
    print("  1. Transp. hinnoittelu - ei piilokustannuksia")
    print("  2. Vakuutettu palvelu")
    print("  3. Ammattimaiset kantajat")
    print("  4. Korkea asiakastyytyväisyys")
    print("  5. 24/7 asiakastuki")
    print()
    
    # Investoijille relevantit mittarit
    print("=" * 90)
    print("INVESTOIJILLE RELEVANTIT KPI:t")
    print("=" * 90)
    print()
    
    print("TALOUDELLINEN KANNATTAVUUS:")
    print(f"  Keskim. voittomarginaali (nykyinen): {sum(r['margin_current'] for r in results)/len(results):.1f}%")
    print(f"  Keskim. voittomarginaali (optimoitu): {sum(r['margin_optimized'] for r in results)/len(results):.1f}%")
    print(f"  Vuosituotto (260 muuttoa): €{annual_revenue_optimized:,.2f}")
    print(f"  Vuosivoitto (260 muuttoa): €{annual_profit_optimized:,.2f}")
    print()
    
    print("SKALAUTUVUUS:")
    print("  5 muuttoa/viikko (260/vuosi): €{:,.2f} voittoa".format(annual_profit_optimized))
    print("  8 muuttoa/viikko (416/vuosi): €{:,.2f} voittoa".format(annual_profit_optimized * 416/260))
    print("  12 muuttoa/viikko (624/vuosi): €{:,.2f} voittoa".format(annual_profit_optimized * 624/260))
    print()
    
    print("ROI ESIMERKKI (esim. autoinvestointi €25,000):")
    roi_years = 25000 / annual_profit_optimized
    print(f"  Takaisinmaksuaika: {roi_years:.1f} vuotta (260 muuttoa/vuosi)")
    print(f"  Takaisinmaksuaika: {roi_years * 260/416:.1f} vuotta (416 muuttoa/vuosi)")
    print(f"  Takaisinmaksuaika: {roi_years * 260/624:.1f} vuotta (624 muuttoa/vuosi)")
    print()
    
    # Export
    export_data = {
        'timestamp': datetime.now().isoformat(),
        'analysis': {
            'current_avg_price': avg_current,
            'optimized_avg_price': avg_optimized,
            'current_avg_profit': avg_profit_current,
            'optimized_avg_profit': avg_profit_optimized,
            'annual_profit_current': annual_profit_current,
            'annual_profit_optimized': annual_profit_optimized,
            'annual_improvement': improvement,
            'scenarios': [
                {
                    'name': r['name'],
                    'revenue_current': r['revenue_current'],
                    'revenue_optimized': r['revenue_optimized'],
                    'profit_current': r['profit_current'],
                    'profit_optimized': r['profit_optimized'],
                    'margin_current': r['margin_current'],
                    'margin_optimized': r['margin_optimized'],
                } for r in results
            ]
        }
    }
    
    with open('pricing_optimization.json', 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print("✓ Tiedot exportattu: pricing_optimization.json")


if __name__ == '__main__':
    print_analysis()
