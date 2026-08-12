import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { siteConfig } from '@/config/site';
import { formatDateFi, formatEuro } from '@/lib/format';

// Sama komponenttipuu ajetaan sekä palvelimella (renderToBuffer) että selaimessa
// (PDFDownloadLink) — siksi logo viitataan julkisella /-poluilla eikä
// tiedostojärjestelmäpolulla kuten laskun PDF:ssä (server/pdf/invoice-pdf.tsx),
// koska selaimessa ei ole pääsyä process.cwd()-polkuihin.
const LOGO_URL = '/images/logo/logo.png';

export type ReceiptLineItem = {
  id: string;
  label: string;
  amount: number; // sis. alv (bruttohinta)
  vatRate: number; // 0.255 tai 0
};

export type ReceiptPdfProps = {
  receiptNumber: string;
  receiptDate: Date;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  requestedDate: string | null;
  items: ReceiptLineItem[];
  paymentMethod: string;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  logo: { width: 90, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  companyName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  muted: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  rightAlign: { textAlign: 'right' },
  docTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  box: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 20 },
  boxLabel: { fontSize: 8, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 },
  boxValue: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  boxLine: { fontSize: 10, color: '#374151', marginBottom: 2 },
  table: { marginBottom: 20 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 6 },
  th: { fontSize: 8, textTransform: 'uppercase', color: '#6b7280' },
  colDescription: { flex: 3 },
  colVat: { flex: 1, textAlign: 'right' },
  colAmount: { flex: 1.3, textAlign: 'right' },
  totals: { alignSelf: 'flex-end', width: 200, marginBottom: 20 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { color: '#6b7280' },
  totalsGrandRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6, marginTop: 2 },
  totalsGrandLabel: { fontWeight: 700 },
  totalsGrandValue: { fontWeight: 700 },
  paymentMethod: { fontSize: 10, color: '#374151', marginBottom: 20 },
  footer: { fontSize: 8, color: '#9ca3af', marginTop: 12 },
});

function computeTotals(items: ReceiptLineItem[]) {
  return items.reduce(
    (acc, item) => {
      const net = item.amount / (1 + item.vatRate);
      const vat = item.amount - net;
      return { net: acc.net + net, vat: acc.vat + vat, gross: acc.gross + item.amount };
    },
    { net: 0, vat: 0, gross: 0 },
  );
}

export function ReceiptPdfDocument(props: ReceiptPdfProps) {
  const {
    receiptNumber,
    receiptDate,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    fromAddress,
    toAddress,
    requestedDate,
    items,
    paymentMethod,
  } = props;
  const totals = computeTotals(items);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={LOGO_URL} style={styles.logo} />
            <Text style={styles.companyName}>Muuttokone.fi</Text>
            <Text style={styles.muted}>+358 45 847 0755</Text>
            <Text style={styles.muted}>info@muuttokone.fi</Text>
            <Text style={styles.muted}>Y-tunnus: {siteConfig.businessId}</Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={styles.docTitle}>Kuitti</Text>
            <Text style={styles.muted}>Nro {receiptNumber}</Text>
            <Text style={styles.muted}>{formatDateFi(receiptDate)}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxLabel}>Asiakas</Text>
          <Text style={styles.boxValue}>{customerName}</Text>
          {customerAddress && <Text style={styles.boxLine}>{customerAddress}</Text>}
          {customerEmail && <Text style={styles.boxLine}>{customerEmail}</Text>}
          {customerPhone && <Text style={styles.boxLine}>{customerPhone}</Text>}
          {requestedDate && <Text style={styles.muted}>Palvelun ajankohta: {formatDateFi(new Date(requestedDate))}</Text>}
        </View>

        {(fromAddress || toAddress) && (
          <View style={styles.box}>
            <Text style={styles.boxLabel}>Muuton osoitteet</Text>
            {fromAddress && <Text style={styles.boxLine}>Mistä: {fromAddress}</Text>}
            {toAddress && <Text style={styles.boxLine}>Minne: {toAddress}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDescription]}>Kuvaus</Text>
            <Text style={[styles.th, styles.colVat]}>ALV</Text>
            <Text style={[styles.th, styles.colAmount]}>Hinta (sis. alv)</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.label}</Text>
              <Text style={styles.colVat}>{item.vatRate === 0 ? '0 %' : '25,5 %'}</Text>
              <Text style={styles.colAmount}>{formatEuro(item.amount)} €</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Veroton hinta</Text>
            <Text>{formatEuro(totals.net)} €</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>ALV</Text>
            <Text>{formatEuro(totals.vat)} €</Text>
          </View>
          <View style={styles.totalsGrandRow}>
            <Text style={styles.totalsGrandLabel}>Yhteensä</Text>
            <Text style={styles.totalsGrandValue}>{formatEuro(totals.gross)} €</Text>
          </View>
        </View>

        <Text style={styles.paymentMethod}>Maksutapa: {paymentMethod}</Text>

        <Text style={styles.footer}>
          Kiitos, että valitsit Muuttokone.fi:n! Säilytä tämä kuitti — asennustyön osalta se toimii tositteena mahdollista
          kotitalousvähennystä varten.
        </Text>
      </Page>
    </Document>
  );
}
