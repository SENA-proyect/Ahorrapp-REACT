import 'dart:convert';
import 'dart:io';
import 'services/ocr_parser_service.dart';
import 'services/qr_parser_service.dart';

void main() {
  final cases = [
    ['OCR básico', 'ocr', 'Tienda\nTOTAL 45.000\nFecha 05/10/2026', 45000, '2026-10-05'],
    ['OCR ISO', 'ocr', 'Tienda\nTOTAL 45000\n2026-10-05', 45000, '2026-10-05'],
    ['OCR subtotal antes de total', 'ocr', 'Tienda\nSubtotal 40.000\nIVA 5.000\nTOTAL 45.000', 45000, null],
    ['OCR decimales COP', 'ocr', 'Tienda\nTOTAL 45.000,00', 45000, null],
    ['OCR monto pequeño', 'ocr', 'Tienda\nTOTAL 500', 500, null],
    ['OCR referencia sin monto', 'ocr', 'Tienda\nReferencia 123456789', null, null],
    ['OCR fecha imposible', 'ocr', 'Tienda\nTOTAL 45000\n31/02/2026', 45000, 'REJECT_INVALID'],
    ['OCR vacío', 'ocr', '', null, null],
    ['QR básico con fecha', 'qr', 'Tienda\nTOTAL 45000\nFecha 05/10/2026', 45000, '2026-10-05'],
    ['QR ISO', 'qr', 'Tienda\nTOTAL 45000\n2026-10-05', 45000, '2026-10-05'],
    ['QR símbolo y referencia', 'qr', 'Referencia 987654321\nTOTAL \$45.000', 45000, null],
    ['QR decimales COP', 'qr', 'Tienda TOTAL 45.000,00', 45000, null],
    ['QR monto pequeño', 'qr', 'Tienda TOTAL 500', 500, null],
    ['QR URL numérica', 'qr', 'https://example.com/comprobante/123456789', null, null],
    ['QR texto no interpretable', 'qr', 'hola', null, null],
  ];
  final results = <Map<String, dynamic>>[];
  for (final c in cases) {
    final g = c[1] == 'ocr' ? OcrParserService.parse(c[2] as String) : QrParserService.parse(c[2] as String);
    final date = g?.fecha.toIso8601String().split('T').first;
    final expectedDate = c[4];
    final pass = (c[3] == null ? g == null : g?.monto == c[3]) &&
      (expectedDate == null || (expectedDate == 'REJECT_INVALID' ? date != '2026-03-03' : date == expectedDate));
    results.add({'caso': c[0], 'correcto': pass, 'montoEsperado': c[3], 'montoObtenido': g?.monto, 'fechaEsperada': expectedDate, 'fechaObtenida': date});
  }
  final report = {'alcance': 'Parsers originales copiados sin cambios; DTO mínimo sin Flutter. No verifica cámara, UI ni BD.', 'aprobados': results.where((r) => r['correcto'] == true).length, 'total': results.length, 'casos': results};
  final json = const JsonEncoder.withIndent('  ').convert(report);
  File('.artifacts/rf18/resultados-parsers.json').writeAsStringSync(json);
  print(json);
}
