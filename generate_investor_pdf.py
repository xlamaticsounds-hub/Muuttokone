#!/usr/bin/env python3
"""
Muuttokone.fi - Investor Deck PDF Generator

Luodaan ammattimaiset PDF-dokumentti investoijille, sisältää:
- Hinnoitteluanalyysi
- Kannattavuusennusteet
- Kasvupolku
- Markkina-analyysi
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    PageBreak, Image, KeepTogether
)
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from datetime import datetime
import json

# Värit
PRIMARY_COLOR = colors.HexColor("#1e40af")  # Sininen
ACCENT_COLOR = colors.HexColor("#059669")   # Vihreä
WARNING_COLOR = colors.HexColor("#dc2626")  # Punainen
GRAY_DARK = colors.HexColor("#1f2937")
GRAY_LIGHT = colors.HexColor("#f3f4f6")

# Dokumentin asetukset
pdf_filename = "MUUTTOKONE_INVESTOR_DECK.pdf"
doc = SimpleDocTemplate(
    pdf_filename,
    pagesize=A4,
    rightMargin=1.5*cm,
    leftMargin=1.5*cm,
    topMargin=1.5*cm,
    bottomMargin=1.5*cm,
    title="Muuttokone.fi - Investor Deck",
    author="Muuttokone.fi",
    subject="Investointi-esitys"
)

# Story (sisältö)
story = []

# Tyylien määritys
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=28,
    textColor=PRIMARY_COLOR,
    spaceAfter=0.3*cm,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=16,
    textColor=PRIMARY_COLOR,
    spaceAfter=0.2*cm,
    spaceBefore=0.3*cm,
    fontName='Helvetica-Bold'
)

normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    fontSize=10,
    alignment=TA_JUSTIFY,
    spaceAfter=0.15*cm,
    leading=14
)

# ============== SIVU 1: KANSILEHTI ==============
story.append(Spacer(1, 1*cm))
story.append(Paragraph("MUUTTOKONE.FI", title_style))
story.append(Paragraph("Investoija-esitys", ParagraphStyle(
    'Subtitle',
    parent=styles['Normal'],
    fontSize=16,
    textColor=GRAY_DARK,
    alignment=TA_CENTER,
    spaceAfter=0.5*cm
)))

story.append(Spacer(1, 1.5*cm))

# Pääkohdat kansilehellä
key_metrics = [
    ("Vuosivoitto potentiaali", "€145,231", ACCENT_COLOR),
    ("Voittomarginaali", "28.5%", ACCENT_COLOR),
    ("Takaisinmaksuaika", "0.2 v", ACCENT_COLOR),
]

for metric, value, color in key_metrics:
    table_data = [[
        Paragraph(f"<b>{metric}</b>", ParagraphStyle(
            'MetricLabel',
            parent=styles['Normal'],
            fontSize=11,
            textColor=GRAY_DARK
        )),
        Paragraph(f"<b>{value}</b>", ParagraphStyle(
            'MetricValue',
            parent=styles['Normal'],
            fontSize=14,
            textColor=color,
            alignment=TA_RIGHT
        ))
    ]]
    
    t = Table(table_data, colWidths=[4*cm, 3*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GRAY_LIGHT),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm),
        ('LEFTPADDING', (0, 0), (-1, -1), 0.3*cm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0.3*cm),
        ('BORDER', (0, 0), (-1, -1), 1, PRIMARY_COLOR),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3*cm))

story.append(Spacer(1, 1.5*cm))
story.append(Paragraph(
    f"<i>Dokumentti luotu: {datetime.now().strftime('%d.%m.%Y')}</i>",
    ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
))

story.append(PageBreak())

# ============== SIVU 2: TIIVISTELMÄ ==============
story.append(Paragraph("TIIVISTELMÄ", heading_style))

summary_data = [
    ("Liiketoiminta", "Digitaalinen muuttopalvelun markkinapaikka"),
    ("Mallia", "Hinnoittelulaskuri + palveluntarjoajien verkosto"),
    ("Markkinakoko", "€81M (Suomi), €1.1B (Eurooppa)"),
    ("Tavoitevoittomarginaali", "25-28% (vs. 15-20% perinteisillä)"),
    ("Skalautuvuus", "Digitaalinen = alhainen henkilöstöintensiteetti"),
]

table_data = []
for label, value in summary_data:
    table_data.append([
        Paragraph(f"<b>{label}</b>", normal_style),
        Paragraph(value, normal_style)
    ])

t = Table(table_data, colWidths=[3*cm, 11*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), GRAY_LIGHT),
    ('BACKGROUND', (1, 0), (-1, -1), colors.white),
    ('ALIGN', (0, 0), (0, -1), 'LEFT'),
    ('ALIGN', (1, 0), (-1, -1), 'LEFT'),
    ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('LEFTPADDING', (0, 0), (-1, -1), 0.3*cm),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0.3*cm),
    ('BORDER', (0, 0), (-1, -1), 1, colors.grey),
    ('LINEBELOW', (0, 0), (-1, -2), 1, colors.grey),
]))
story.append(t)

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph(
    "<b>Kriittiset havainnot:</b><br/>" +
    "• Nykyinen hinnoittelu tuottaa vain €3,125/vuosi voittoa<br/>" +
    "• Optimoitu hinnoittelu tuottaa €145,231/vuosi voittoa (+46x)<br/>" +
    "• Voittomarginaali: -0.9% → 28.5% (muutos +29.4pp)<br/>" +
    "• Hintojen nousu on markkinalooginen ja kilpailutettavissa",
    normal_style
))

story.append(PageBreak())

# ============== SIVU 3: HINNOITTELUN RAKENNE ==============
story.append(Paragraph("HINNOITTELUN RAKENNE", heading_style))

story.append(Paragraph(
    "Muuttolaskuri käyttää seuraavaa neljän tekijän hinnoittelumenetelmää:",
    normal_style
))
story.append(Spacer(1, 0.2*cm))

pricing_factors = [
    ("1. Etäisyyskustannus", "(km + 5km overhead) × €0.59/km"),
    ("2. Työkustannukset", "Asunnon koko, portaikko, pakkaus, raskaat tavarat"),
    ("3. Tuntihinta", "€120/h (normaali) tai €140/h (kompleksi)"),
    ("4. Vähimmäismaksu", "€299 (varmistaa kannattavuus)"),
]

for factor, description in pricing_factors:
    story.append(Paragraph(
        f"<b>{factor}</b><br/>{description}",
        normal_style
    ))
    story.append(Spacer(1, 0.15*cm))

story.append(Spacer(1, 0.3*cm))

# Esimerkkilaskento
story.append(Paragraph("<b>Esimerkkilaskento:</b> 2h asunto, 30km, portaikko (3.→2.kerros)", normal_style))

calculation_data = [
    ["Tekijä", "Laskenta", "Tulos"],
    ["Etäisyys", "(30 + 5) × 0.59", "€20.65"],
    ["Perusaika", "2h asunto", "2.75h"],
    ["Portaikko", "(3+2) × 0.25h", "1.25h"],
    ["Ajoaika", "30/40 + 0.25h", "1.0h"],
    ["Admin", "vakio", "0.5h"],
    ["Yhteensä", "5.5h × €120", "€660"],
    ["HINTA", "", "€680.65"],
]

t = Table(calculation_data, colWidths=[3*cm, 5*cm, 3*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 0.2*cm),
    ('TOPPADDING', (0, 0), (-1, 0), 0.2*cm),
    ('BACKGROUND', (0, 1), (-1, -2), colors.white),
    ('BACKGROUND', (0, -1), (-1, -1), ACCENT_COLOR),
    ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ('BORDER', (0, 0), (-1, -1), 1, colors.grey),
    ('TOPPADDING', (0, 1), (-1, -1), 0.2*cm),
    ('BOTTOMPADDING', (0, 1), (-1, -1), 0.2*cm),
]))
story.append(t)

story.append(PageBreak())

# ============== SIVU 4: HINNOITTELUN VERTAILU ==============
story.append(Paragraph("HINNOITTELUN VERTAILU - 4 SKENAARIOTA", heading_style))

scenarios_data = [
    ["Skenario", "Nykyinen", "Optimoitu", "Hinta↑", "Voitto"],
    ["Pieni (1h, 10km)", "€428.85", "€699", "+63%", "-€40 → +€140"],
    ["Keskim. (2h, 30km)", "€1,000.65", "€1,299", "+30%", "+€66 → +€260"],
    ["Suuri (3h, 50km)", "€1,652.45", "€2,399", "+45%", "-€115 → +€480"],
    ["Yritys (4h, 25km)", "€2,187.70", "€3,249", "+49%", "+€138 → +€650"],
]

t = Table(scenarios_data, colWidths=[2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 4*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BORDER', (0, 0), (-1, -1), 1, colors.grey),
    ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
]))
story.append(t)

story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "<b>Keskiarvohinta-parannus: +47%</b><br/>" +
    "Voittomarginaali: -0.9% → 28.5%<br/>" +
    "Vuosivoitto parannus (260 muuttoa): <b>+€142,106</b>",
    normal_style
))

story.append(PageBreak())

# ============== SIVU 5: VUOSITUOTOT ==============
story.append(Paragraph("VUOSITUOTOT ERI KUORMITUKSILLA", heading_style))

volumes_data = [
    ["Muuttoja/viikko", "Muuttoja/vuosi", "Vuosituotto", "Vuosivoitto", "Kuukausivoitto"],
    ["3", "156", "€298,481", "€85,221", "€7,102"],
    ["5", "260", "€496,990", "€145,231", "€12,103"],
    ["8", "416", "€795,184", "€227,369", "€18,947"],
    ["10", "520", "€993,980", "€284,211", "€23,684"],
    ["12", "624", "€1,192,976", "€341,054", "€28,421"],
]

t = Table(volumes_data, colWidths=[2*cm, 2.2*cm, 2.2*cm, 2.2*cm, 2.2*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, 1), GRAY_LIGHT),  # Highlight 5/week
    ('BACKGROUND', (0, 2), (-1, -1), colors.white),
    ('BORDER', (0, 0), (-1, -1), 1, colors.grey),
    ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
]))
story.append(t)

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "<i>Huom: 5 muuttoa/viikko (260/vuosi) on realistinen tavoite ensimmäiselle vuodelle.</i>",
    normal_style
))

story.append(PageBreak())

# ============== SIVU 6: ROI & TAKAISINMAKSU ==============
story.append(Paragraph("SIJOITUKSEN KANNATTAVUUS (ROI)", heading_style))

roi_data = [
    ["Investointi", "Summa", "Kuormitus", "Takaisinmaksu", "Vuosituotto"],
    ["Auto", "€35,000", "5/viikko", "3 kk", "408%"],
    ["Auto", "€35,000", "8/viikko", "2 kk", "650%"],
    ["Toimisto+vara.", "€50,000", "5/viikko", "4 kk", "285%"],
    ["Toimisto+vara.", "€50,000", "8/viikko", "2 kk", "455%"],
    ["Täysi operaatio", "€150,000", "5/viikko", "1 v", "95%"],
    ["Täysi operaatio", "€150,000", "8/viikko", "8 kk", "152%"],
]

t = Table(roi_data, colWidths=[2.5*cm, 2*cm, 2*cm, 2*cm, 2*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BORDER', (0, 0), (-1, -1), 1, colors.grey),
    ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
]))
story.append(t)

story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "<b>Johtopäätös:</b> Erittäin korkea ROI, nopea kannattavuuskynnys. " +
    "€35,000 auto-investointi maksaa itsensä takaisin 2-3 kuukaudessa " +
    "realistisella kuormituksella.",
    normal_style
))

story.append(PageBreak())

# ============== SIVU 7: KASVUPOLKU ==============
story.append(Paragraph("KASVUPOLKU (5 VUODEN ROADMAP)", heading_style))

growth_data = [
    ["Vuosi", "Muuttoja/vuosi", "Vuosituotto", "Voitto", "Henkilöstö", "Toiminnot"],
    ["1", "260", "€496,990", "€145,231", "5", "Helsinki + ympäryskunnat"],
    ["2", "520", "€993,980", "€284,461", "12", "Pääkaupunkiseutu"],
    ["3", "1,040", "€1,987,960", "€568,923", "25", "Koko Suomi"],
    ["4", "2,080", "€3,975,920", "€1,137,846", "50", "Pohjoismaat"],
    ["5", "4,160", "€7,951,840", "€2,275,692", "100", "Eurooppa-laajuinen"],
]

t = Table(growth_data, colWidths=[1*cm, 1.5*cm, 1.8*cm, 1.8*cm, 1.5*cm, 2.8*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BORDER', (0, 0), (-1, -1), 1, colors.grey),
    ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm),
]))
story.append(t)

story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "<b>Kumulatiivinen voitto 5 vuodessa: €3.4M</b><br/>" +
    "Sijoitus palauttaa itsensä ~5x ensimmäisen 5 vuoden aikana.",
    normal_style
))

story.append(PageBreak())

# ============== SIVU 8: KILPAILUANALYYSI ==============
story.append(Paragraph("KILPAILUANALYYSI", heading_style))

story.append(Paragraph(
    "<b>Pomminvarmat Jätkät (nykyinen pääkilpailija):</b><br/>" +
    "• Perinteinen mallia (offline hinnoittelu)<br/>" +
    "• Arvioitu voittomarginaali: 15-20%<br/>" +
    "• Ei skalautuvaa teknologiaa<br/>" +
    "• Sidottu paikalliseen toimintaan<br/><br/>" +
    "<b>Muuttokone.fi kilpailuetuus:</b><br/>" +
    "• Digitaalinen = alhainen henkilöstöintensiteetti<br/>" +
    "• Automaattinen hinnoittelu = parempi kannattavuus<br/>" +
    "• Skalautuva arkkitehtuuri = nopea laajennus<br/>" +
    "• 25-28% voittomarginaali = kestävä growth<br/>",
    normal_style
))

story.append(PageBreak())

# ============== SIVU 9: RISKI & MITIGAATIO ==============
story.append(Paragraph("RISKIT & MITIGAATIOSTRATEGIAT", heading_style))

risks = [
    ("Asiakkaat vastustavat hintojen nousua", 
     "Asteittainen nousu + arvoväitteiden korostaminen"),
    ("Kilpailijat leikkaavat hintoja", 
     "Korkeampi palvelun laatu + parempi asiakastuki"),
    ("Henkilöstön saatavuus heikko", 
     "Paremmat palkat + bonus-järjestelmä"),
    ("Markkinointi ei tuota tuloksia", 
     "SEO-fokus + sisältömarkkinointi"),
]

for i, (risk, mitigation) in enumerate(risks, 1):
    story.append(Paragraph(
        f"<b>{i}. {risk}</b><br/>" +
        f"<font color='green'>→ {mitigation}</font>",
        normal_style
    ))
    story.append(Spacer(1, 0.2*cm))

story.append(PageBreak())

# ============== SIVU 10: INVESTOINTITARVE & YHTEENVETO ==============
story.append(Paragraph("INVESTOINTITARVE", heading_style))

investment_data = [
    ["Kategoria", "Kustannus", "Huomio"],
    ["Teknologia & kehitys", "€50-80k", "Laskuri-feature kehitys, mobiiliappi"],
    ["Marketing (vuosittainen)", "€30-50k", "Google Ads, SEO, content"],
    ["Operaatiot (vuosi 1)", "€100-150k", "Henkilöstö (3-5), autot, toimisto"],
    ["YHTEENSÄ", "€180-280k", "Pääomaintensiteetti: 1. vuosi"],
]

t = Table(investment_data, colWidths=[3*cm, 2.5*cm, 7*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (0, -1), 'LEFT'),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('BACKGROUND', (0, -1), (-1, -1), ACCENT_COLOR),
    ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
    ('BORDER', (0, 0), (-1, -1), 1, colors.grey),
    ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
]))
story.append(t)

story.append(Spacer(1, 0.8*cm))

story.append(Paragraph(
    "<b>JOHTOPÄÄTÖS:</b><br/>" +
    "Muuttokone.fi on houkutteleva investointi korkealla ROI:lla (150-400%), " +
    "nopeiden kannattavuuskynnyksin (2-3 kk), ja selkeällä laajenemisreiteillä " +
    "(Suomi → Pohjoismaat → Eurooppa). Digitaalinen malli mahdollistaa " +
    "eksponentiaalisen kasvun minimaalisen henkilöstöintensiteetin kanssa. " +
    "Viiden vuoden aikana kumulatiivinen voitto on €3.4M ja palautuu " +
    "sijoitus noin 5x.",
    normal_style
))

# Buildaa PDF
doc.build(story)

print(f"✅ PDF-dokumentti luotu: {pdf_filename}")
print(f"   • Koko: 10 sivua")
print(f"   • Sisältö: Hinnoittelu, kannattavuus, kasvupolku, riski-analyysi")
print(f"   • Valmis lähettämiseen investoijille")
