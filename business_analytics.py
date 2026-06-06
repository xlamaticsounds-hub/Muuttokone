#!/usr/bin/env python3
"""
Muuttokone.fi - Business Analytics & Pricing Analysis
Investoijille suunnattu laskelmadokumentaatio
"""

import json
from datetime import datetime
from typing import Dict, List, Tuple

class PricingCalculator:
    """Muuttolaskurin hinnoittelu- ja kannattavuusanalyysi"""
    
    # Vakiot
    PRICING_CONSTANTS = {
        'rate_per_km': 0.59,        # €/km
        'finland_loop_km': 5,        # km overhead
        'hourly_rate_default': 120,  # €/h
        'hourly_rate_complex': 140,  # €/h
        'minimum_charge': 299,       # €
        'vat_rate': 0.255,          # 25.5%
    }
    
    # Asunnon koot ja perusajat
    APARTMENT_TIMES = {
        '1h': {'load': 1.0, 'unload': 0.75},
        '2h': {'load': 1.5, 'unload': 1.25},
        '3h': {'load': 2.5, 'unload': 2.0},
        '4h+': {'load': 3.5, 'unload': 3.0},
        'office': {'load': 3.5, 'unload': 3.0},
    }
    
    def __init__(self):
        self.calculations = []
    
    def calculate_move(
        self,
        distance_km: int,
        apartment_size: str,
        floor_from: int = 0,
        floor_to: int = 0,
        has_elevator_from: bool = True,
        has_elevator_to: bool = True,
        boxes: int = 20,
        needs_packing: bool = False,
        heavy_items: int = 0,
        service_type: str = 'moving'  # moving, transport, recycling
    ) -> Dict:
        """Laskee hinnan yksittäiselle muutolle"""
        
        # 1. ETÄISYYSKUSTANNUS
        total_distance = distance_km + self.PRICING_CONSTANTS['finland_loop_km']
        distance_cost = total_distance * self.PRICING_CONSTANTS['rate_per_km']
        
        # 2. TYÖKUSTANNUKSET
        apartment_times = self.APARTMENT_TIMES.get(apartment_size, self.APARTMENT_TIMES['1h'])
        
        base_load_time = apartment_times['load']
        base_unload_time = apartment_times['unload']
        
        # Portaikko-lisä
        load_stair_factor = 0 if has_elevator_from else max(0, floor_from) * 0.25
        unload_stair_factor = 0 if has_elevator_to else max(0, floor_to) * 0.25
        
        # Muut tekijät
        drive_time = (distance_km / 40) + 0.25
        admin_time = 0.5
        packing_time = 0
        if needs_packing:
            packing_time = 2 if apartment_size == '1h' else 4
        
        heavy_item_time = heavy_items * 0.5
        
        # Laatikot = 2 min per laatikko
        boxes_time = boxes * 2 / 60
        
        # Kokonaisaika
        total_labor_hours = (
            base_load_time + load_stair_factor +
            base_unload_time + unload_stair_factor +
            drive_time + packing_time + admin_time +
            heavy_item_time + boxes_time
        )
        
        # Pyöristä ylöspäin 0.5h
        import math
        total_labor_hours = math.ceil(total_labor_hours * 2) / 2
        
        # 3. TUNTIHINTA
        is_complex = (not has_elevator_from and floor_from > 2) or \
                     (not has_elevator_to and floor_to > 2) or \
                     apartment_size == '4h+'
        hourly_rate = self.PRICING_CONSTANTS['hourly_rate_complex'] if is_complex else self.PRICING_CONSTANTS['hourly_rate_default']
        
        labor_cost = total_labor_hours * hourly_rate
        
        # 4. LOPULLINEN HINTA
        subtotal = distance_cost + labor_cost
        
        # Vähimmäismaksu
        if subtotal < self.PRICING_CONSTANTS['minimum_charge']:
            subtotal = self.PRICING_CONSTANTS['minimum_charge']
        
        # ALV
        vat_rate = self.PRICING_CONSTANTS['vat_rate']
        total_with_vat = subtotal
        vat_amount = total_with_vat - (total_with_vat / (1 + vat_rate))
        subtotal_without_vat = total_with_vat - vat_amount
        
        result = {
            'distance_km': distance_km,
            'total_distance_km': total_distance,
            'apartment_size': apartment_size,
            'floor_from': floor_from,
            'floor_to': floor_to,
            'distance_cost': round(distance_cost, 2),
            'labor_hours': total_labor_hours,
            'hourly_rate': hourly_rate,
            'labor_cost': round(labor_cost, 2),
            'subtotal_ex_vat': round(subtotal_without_vat, 2),
            'vat_amount': round(vat_amount, 2),
            'total_price': round(total_with_vat, 2),
            'service_type': service_type,
        }
        
        self.calculations.append(result)
        return result
    
    def profit_analysis(self, price_data: Dict, cost_data: Dict = None) -> Dict:
        """Analysoi kannattavuutta"""
        if cost_data is None:
            cost_data = {
                'driver_hourly_cost': 35,      # €/h
                'vehicle_hourly_cost': 25,     # €/h (polttoaine, kunnossapito)
                'crew_member_cost': 30,        # €/h per henkilö
                'admin_overhead_per_move': 15, # €
                'marketing_percentage': 0.08,  # 8% myynnistä
            }
        
        total_price = price_data['total_price']
        labor_hours = price_data['labor_hours']
        
        # Kustannukset
        driver_cost = labor_hours * cost_data['driver_hourly_cost']
        vehicle_cost = labor_hours * cost_data['vehicle_hourly_cost']
        crew_cost = labor_hours * (2 * cost_data['crew_member_cost'])  # 2 kantajaa
        admin_cost = cost_data['admin_overhead_per_move']
        marketing_cost = total_price * cost_data['marketing_percentage']
        
        total_cost = driver_cost + vehicle_cost + crew_cost + admin_cost + marketing_cost
        gross_profit = total_price - total_cost
        profit_margin = (gross_profit / total_price * 100) if total_price > 0 else 0
        
        return {
            'total_revenue': round(total_price, 2),
            'driver_cost': round(driver_cost, 2),
            'vehicle_cost': round(vehicle_cost, 2),
            'crew_cost': round(crew_cost, 2),
            'admin_overhead': round(admin_cost, 2),
            'marketing_cost': round(marketing_cost, 2),
            'total_cost': round(total_cost, 2),
            'gross_profit': round(gross_profit, 2),
            'profit_margin_percent': round(profit_margin, 1),
        }


def generate_scenarios():
    """Luo erilaisia laskentaskenaarioita"""
    calculator = PricingCalculator()
    scenarios = []
    
    print("=" * 80)
    print("MUUTTOKONE.FI - BUSINESS ANALYTICS")
    print("Hinnoittelu & Kannattavuusanalyysi Investoijille")
    print("=" * 80)
    print()
    
    # SKENARIO 1: Pieni muutto kaupungissa
    print("SKENARIO 1: PIENI MUUTTO (1h → 1h, 10km)")
    print("-" * 80)
    result1 = calculator.calculate_move(
        distance_km=10,
        apartment_size='1h',
        floor_from=0,
        floor_to=1,
        has_elevator_from=True,
        has_elevator_to=True,
        boxes=15,
        needs_packing=False,
        heavy_items=0
    )
    profit1 = calculator.profit_analysis(result1)
    
    print(f"Etäisyys: {result1['distance_km']}km")
    print(f"Kokonaismatka: {result1['total_distance_km']}km")
    print(f"\nHINNOITTELU:")
    print(f"  Kilometerikustannus ({result1['total_distance_km']}km × €0,59/km): €{result1['distance_cost']}")
    print(f"  Työtunnit: {result1['labor_hours']}h × €{result1['hourly_rate']}/h = €{result1['labor_cost']}")
    print(f"\n  Väliyhteensä (ilman ALV): €{result1['subtotal_ex_vat']}")
    print(f"  ALV (25,5%): €{result1['vat_amount']}")
    print(f"  LOPULLINEN HINTA: €{result1['total_price']}")
    print(f"\nKANNATTAVUUS:")
    print(f"  Kokonaistuotto: €{profit1['total_revenue']}")
    print(f"  Kokonaiskulut: €{profit1['total_cost']}")
    print(f"  Bruttonvoitto: €{profit1['gross_profit']}")
    print(f"  Voittomarginaali: {profit1['profit_margin_percent']}%")
    print(f"\n  Kustannusjakauma:")
    print(f"    - Kuljettaja: €{profit1['driver_cost']}")
    print(f"    - Ajoneuvo: €{profit1['vehicle_cost']}")
    print(f"    - Kantajat (2×): €{profit1['crew_cost']}")
    print(f"    - Admin: €{profit1['admin_overhead']}")
    print(f"    - Markkinointi (8%): €{profit1['marketing_cost']}")
    print()
    scenarios.append({
        'name': 'Pieni muutto',
        'pricing': result1,
        'profit': profit1
    })
    
    # SKENARIO 2: Keskikokoinen muutto portaikolla
    print("SKENARIO 2: KESKIKOKOINEN MUUTTO (2h → 2h, 30km, portaikko)")
    print("-" * 80)
    result2 = calculator.calculate_move(
        distance_km=30,
        apartment_size='2h',
        floor_from=3,
        floor_to=2,
        has_elevator_from=False,
        has_elevator_to=False,
        boxes=30,
        needs_packing=False,
        heavy_items=1
    )
    profit2 = calculator.profit_analysis(result2)
    
    print(f"Etäisyys: {result2['distance_km']}km")
    print(f"Kerrokset: {result2['floor_from']}. → {result2['floor_to']}. (ei hissiä)")
    print(f"\nHINNOITTELY:")
    print(f"  Kilometerikustannus ({result2['total_distance_km']}km × €0,59/km): €{result2['distance_cost']}")
    print(f"  Työtunnit: {result2['labor_hours']}h × €{result2['hourly_rate']}/h = €{result2['labor_cost']}")
    print(f"\n  Väliyhteensä (ilman ALV): €{result2['subtotal_ex_vat']}")
    print(f"  ALV (25,5%): €{result2['vat_amount']}")
    print(f"  LOPULLINEN HINTA: €{result2['total_price']}")
    print(f"\nKANNATTAVUUS:")
    print(f"  Kokonaistuotto: €{profit2['total_revenue']}")
    print(f"  Kokonaiskulut: €{profit2['total_cost']}")
    print(f"  Bruttonvoitto: €{profit2['gross_profit']}")
    print(f"  Voittomarginaali: {profit2['profit_margin_percent']}%")
    print()
    scenarios.append({
        'name': 'Keskikokoinen muutto',
        'pricing': result2,
        'profit': profit2
    })
    
    # SKENARIO 3: Suuri muutto pakkauspalvelulla
    print("SKENARIO 3: SUURI MUUTTO (3h → 3h, 50km, pakkauspalvelu)")
    print("-" * 80)
    result3 = calculator.calculate_move(
        distance_km=50,
        apartment_size='3h',
        floor_from=1,
        floor_to=1,
        has_elevator_from=True,
        has_elevator_to=True,
        boxes=50,
        needs_packing=True,
        heavy_items=2
    )
    profit3 = calculator.profit_analysis(result3)
    
    print(f"Etäisyys: {result3['distance_km']}km")
    print(f"Palvelut: Pakkaus + kuljetus")
    print(f"\nHINNOITTELY:")
    print(f"  Kilometerikustannus ({result3['total_distance_km']}km × €0,59/km): €{result3['distance_cost']}")
    print(f"  Työtunnit: {result3['labor_hours']}h × €{result3['hourly_rate']}/h = €{result3['labor_cost']}")
    print(f"\n  Väliyhteensä (ilman ALV): €{result3['subtotal_ex_vat']}")
    print(f"  ALV (25,5%): €{result3['vat_amount']}")
    print(f"  LOPULLINEN HINTA: €{result3['total_price']}")
    print(f"\nKANNATTAVUUS:")
    print(f"  Kokonaistuotto: €{profit3['total_revenue']}")
    print(f"  Kokonaiskulut: €{profit3['total_cost']}")
    print(f"  Bruttonvoitto: €{profit3['gross_profit']}")
    print(f"  Voittomarginaali: {profit3['profit_margin_percent']}%")
    print()
    scenarios.append({
        'name': 'Suuri muutto',
        'pricing': result3,
        'profit': profit3
    })
    
    # SKENARIO 4: Yritysmuutto (toimisto)
    print("SKENARIO 4: YRITYSMUUTTO (toimisto, 25km, kompleksi)")
    print("-" * 80)
    result4 = calculator.calculate_move(
        distance_km=25,
        apartment_size='office',
        floor_from=4,
        floor_to=3,
        has_elevator_from=True,
        has_elevator_to=False,
        boxes=40,
        needs_packing=True,
        heavy_items=3
    )
    profit4 = calculator.profit_analysis(result4)
    
    print(f"Etäisyys: {result4['distance_km']}km")
    print(f"Kerrokset: {result4['floor_from']}. (hissi) → {result4['floor_to']}. (ei hissiä)")
    print(f"\nHINNOITTELY:")
    print(f"  Kilometerikustannus ({result4['total_distance_km']}km × €0,59/km): €{result4['distance_cost']}")
    print(f"  Työtunnit: {result4['labor_hours']}h × €{result4['hourly_rate']}/h = €{result4['labor_cost']}")
    print(f"\n  Väliyhteensä (ilman ALV): €{result4['subtotal_ex_vat']}")
    print(f"  ALV (25,5%): €{result4['vat_amount']}")
    print(f"  LOPULLINEN HINTA: €{result4['total_price']}")
    print(f"\nKANNATTAVUUS:")
    print(f"  Kokonaistuotto: €{profit4['total_revenue']}")
    print(f"  Kokonaiskulut: €{profit4['total_cost']}")
    print(f"  Bruttonvoitto: €{profit4['gross_profit']}")
    print(f"  Voittomarginaali: {profit4['profit_margin_percent']}%")
    print()
    scenarios.append({
        'name': 'Yritysmuutto',
        'pricing': result4,
        'profit': profit4
    })
    
    # YHTEENVETO
    print("=" * 80)
    print("YHTEENVETO & TUNNUSLUVUT")
    print("=" * 80)
    print()
    
    total_revenue = sum(s['profit']['total_revenue'] for s in scenarios)
    total_profit = sum(s['profit']['gross_profit'] for s in scenarios)
    avg_margin = sum(s['profit']['profit_margin_percent'] for s in scenarios) / len(scenarios)
    
    print("PALVELUN TALOUSANALYYSI:")
    print(f"  Keskimääräinen muuton hinta: €{total_revenue / len(scenarios):.2f}")
    print(f"  Keskimääräinen voittomarginaali: {avg_margin:.1f}%")
    print(f"  Keskimääräinen bruttonvoitto per muutto: €{total_profit / len(scenarios):.2f}")
    print()
    
    print("VUOSITUOTTO-SKENAARIOT (oletuksella 5 muuttoa/viikko = 260 muuttoa/vuosi):")
    print(f"  Vuosituotto (keskim. hinnalla): €{total_revenue / len(scenarios) * 260:,.2f}")
    print(f"  Vuosituotto (keskim. voitolla): €{total_profit / len(scenarios) * 260:,.2f}")
    print()
    
    print("KUORMITUSVARIANTIT:")
    low_volume = total_profit / len(scenarios) * 150  # 3 muuttoa/viikko
    mid_volume = total_profit / len(scenarios) * 260  # 5 muuttoa/viikko
    high_volume = total_profit / len(scenarios) * 450 # 8-9 muuttoa/viikko
    
    print(f"  Matala kuormitus (3/viikko, 150/vuosi): €{low_volume:,.2f} voittoa/vuosi")
    print(f"  Normaali kuormitus (5/viikko, 260/vuosi): €{mid_volume:,.2f} voittoa/vuosi")
    print(f"  Korkea kuormitus (9/viikko, 450/vuosi): €{high_volume:,.2f} voittoa/vuosi")
    print()
    
    print("HINNOITTELUN ELASTISUUS (hintakorotus vaikutus):")
    print("  +5% hintaan → +5% voittoon (muut tekijät vakio)")
    print("  +10% hintaan → +10% voittoon")
    print(f"  Esim. normaalissa kuormituksessa (+5%): €{mid_volume * 1.05:,.2f}")
    print()
    
    print("=" * 80)
    print("KUSTANNUSRAKENNE - Keskiarvo kaikista skenaarioista")
    print("=" * 80)
    avg_costs = {k: sum(s['profit'][k] for s in scenarios) / len(scenarios) 
                 for k in profit1.keys()}
    
    total_cost_avg = avg_costs['total_cost']
    print(f"\nKokonaiskulut: 100%")
    print(f"  Kuljettaja ({avg_costs['driver_cost']/total_cost_avg*100:.1f}%): €{avg_costs['driver_cost']:.2f}")
    print(f"  Ajoneuvo ({avg_costs['vehicle_cost']/total_cost_avg*100:.1f}%): €{avg_costs['vehicle_cost']:.2f}")
    print(f"  Kantajat ({avg_costs['crew_cost']/total_cost_avg*100:.1f}%): €{avg_costs['crew_cost']:.2f}")
    print(f"  Admin ({avg_costs['admin_overhead']/total_cost_avg*100:.1f}%): €{avg_costs['admin_overhead']:.2f}")
    print(f"  Markkinointi ({avg_costs['marketing_cost']/total_cost_avg*100:.1f}%): €{avg_costs['marketing_cost']:.2f}")
    print()
    
    # Export JSON
    export_data = {
        'timestamp': datetime.now().isoformat(),
        'scenarios': [
            {
                'name': s['name'],
                'pricing': s['pricing'],
                'profit': s['profit']
            } for s in scenarios
        ],
        'summary': {
            'avg_price': total_revenue / len(scenarios),
            'avg_margin_percent': avg_margin,
            'annual_profit_low': low_volume,
            'annual_profit_mid': mid_volume,
            'annual_profit_high': high_volume,
        }
    }
    
    with open('business_analytics.json', 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print("✓ Tiedot exportattu: business_analytics.json")
    print()
    
    return scenarios


if __name__ == '__main__':
    generate_scenarios()
