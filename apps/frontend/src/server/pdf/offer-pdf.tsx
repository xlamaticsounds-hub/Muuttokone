import path from 'path';
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { siteConfig } from '@/config/site';
import { formatIsoDateFi, offerTitle, offerTotals, type OfferData } from '@/lib/offer';

// Yleinen tarjous / tilausvahvistus PDF:nä (muualta tulleet keikat). Sama ulkoasu ja logo kuin
// kuitissa ja laskussa (server/pdf/receipt-pdf.tsx). Ei tavaraluetteloa: vain palvelun kuvaus ja
// hintarivit. Helvetica-fontissa ei ole kaikkia merkkejä (esim. nuolia), joten tekstit pidetään
// tavallisina.
const LOGO_PATH = path.join(process.cwd(), 'public/images/logo/logo.png');

const euro = (value: number) => value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingHorizontal: 40, paddingBottom: 64, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  logo: { width: 90, marginBottom: 8 },
  companyName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  muted: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  rightAlign: { textAlign: 'right' },
  docTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  boxes: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  box: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 8, padding: 12 },
  boxLabel: { fontSize: 8, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 },
  boxValue: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  boxLine: { fontSize: 10, color: '#374151', marginBottom: 2 },
  sectionTitle: { fontSize: 8, textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 },
  paragraph: { fontSize: 10, lineHeight: 1.5, color: '#1f2937', marginBottom: 16 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 6 },
  th: { fontSize: 8, textTransform: 'uppercase', color: '#6b7280' },
  colDescription: { flex: 3 },
  colVat: { flex: 1, textAlign: 'right' },
  colAmount: { flex: 1.3, textAlign: 'right' },
  totals: { alignSelf: 'flex-end', width: 210, marginTop: 8, marginBottom: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { color: '#6b7280' },
  totalsGrandRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6, marginTop: 2 },
  totalsGrand: { fontSize: 12, fontWeight: 700 },
  vatNotice: { fontSize: 8, color: '#6b7280', marginBottom: 16 },
  priceNote: { fontSize: 10, color: '#1f2937', backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 16, lineHeight: 1.4 },
  callout: { fontSize: 10, color: '#1e3a8a', backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, marginBottom: 16, lineHeight: 1.4 },
  terms: { fontSize: 8, color: '#6b7280', lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, fontSize: 8, color: '#9ca3af', textAlign: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
});

function OfferPdfDocument({ offer, number }: { offer: OfferData; number: string }) {
  const totals = offerTotals(offer.lines);
  const zeroVat = offer.lines.some((l) => l.vatRate === 0);
  const isConfirmation = offer.type === 'vahvistus';
  const title = offerTitle(offer.type);
  const when = [offer.serviceDate ? formatIsoDateFi(offer.serviceDate) : null, offer.serviceTime].filter(Boolean).join(' ');

  return (
    <Document title={`${title} ${number}`} author={siteConfig.brand.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={LOGO_PATH} style={styles.logo} />
            <Text style={styles.companyName}>{siteConfig.brand.name}</Text>
            <Text style={styles.muted}>{siteConfig.contact.phone.display}</Text>
            <Text style={styles.muted}>{siteConfig.contact.email}</Text>
            <Text style={styles.muted}>
              {siteConfig.invoicePayee} · Y-tunnus {siteConfig.businessId}
            </Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.muted}>Nro {number}</Text>
            <Text style={styles.muted}>Päiväys {formatIsoDateFi(offer.issuedOn)}</Text>
            {!isConfirmation && offer.validUntil && <Text style={styles.muted}>Voimassa {formatIsoDateFi(offer.validUntil)} asti</Text>}
          </View>
        </View>

        <View style={styles.boxes}>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>Asiakas</Text>
            <Text style={styles.boxValue}>{offer.customerName}</Text>
            {offer.customerPhone && <Text style={styles.boxLine}>{offer.customerPhone}</Text>}
            {offer.customerEmail && <Text style={styles.boxLine}>{offer.customerEmail}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>Keikka</Text>
            <Text style={styles.boxValue}>{when || 'Ajankohta sovitaan erikseen'}</Text>
            {offer.fromAddress && <Text style={styles.boxLine}>Mistä: {offer.fromAddress}</Text>}
            {offer.toAddress && <Text style={styles.boxLine}>Minne: {offer.toAddress}</Text>}
          </View>
        </View>

        {offer.description ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Palvelun kuvaus</Text>
            <Text style={styles.paragraph}>{offer.description}</Text>
          </View>
        ) : null}

        {offer.lines.length > 0 && (
          <View wrap={false}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colDescription]}>Kuvaus</Text>
              <Text style={[styles.th, styles.colVat]}>ALV</Text>
              <Text style={[styles.th, styles.colAmount]}>Hinta</Text>
            </View>
            {offer.lines.map((line, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDescription}>{line.label}</Text>
                <Text style={styles.colVat}>{line.vatRate === 0 ? '0 %' : '25,5 %'}</Text>
                <Text style={styles.colAmount}>{euro(line.amount)} €</Text>
              </View>
            ))}
            <View style={styles.totals}>
              {totals.vat > 0 && (
                <>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Veroton hinta</Text>
                    <Text>{euro(totals.net)} €</Text>
                  </View>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>ALV</Text>
                    <Text>{euro(totals.vat)} €</Text>
                  </View>
                </>
              )}
              <View style={styles.totalsGrandRow}>
                <Text style={styles.totalsGrand}>{isConfirmation ? 'Sovittu hinta' : 'Yhteensä'}</Text>
                <Text style={styles.totalsGrand}>{euro(totals.gross)} €</Text>
              </View>
            </View>
            {zeroVat && <Text style={styles.vatNotice}>{siteConfig.vatExemptionNotice}</Text>}
          </View>
        )}

        {offer.priceNote ? (
          <View wrap={false}>
            {offer.lines.length === 0 && <Text style={styles.sectionTitle}>Hinnoittelu</Text>}
            <Text style={styles.priceNote}>{offer.priceNote}</Text>
          </View>
        ) : null}

        {offer.notes ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Lisätiedot</Text>
            <Text style={styles.paragraph}>{offer.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.callout}>
          {isConfirmation
            ? 'Kiitos tilauksesta! Jos jokin tiedoista muuttuu, ilmoitathan meille mahdollisimman pian.'
            : `Voit hyväksyä tarjouksen vastaamalla viestiin tai soittamalla numeroon ${siteConfig.contact.phone.display}.`}
        </Text>

        {offer.terms ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Ehdot</Text>
            <Text style={styles.terms}>{offer.terms}</Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          {siteConfig.invoicePayee} · Y-tunnus {siteConfig.businessId} · {siteConfig.contact.phone.display} · {siteConfig.contact.email} · muuttokone.fi
        </Text>
      </Page>
    </Document>
  );
}

export async function renderOfferPdf(offer: OfferData, number: string): Promise<Buffer> {
  return renderToBuffer(<OfferPdfDocument offer={offer} number={number} />);
}
