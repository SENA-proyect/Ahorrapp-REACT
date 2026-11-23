// DTO mínimo para ejecutar los parsers originales sin dependencias de interfaz.
class GastoModel {
  final String? descripcion;
  final double monto;
  final DateTime fecha;
  final String? categoriaNombre;
  GastoModel({this.descripcion, required this.monto, required this.fecha, this.categoriaNombre});
}
