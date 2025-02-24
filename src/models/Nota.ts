import mongoose from 'mongoose';

const NotaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Por favor ingrese un título'],
    maxlength: [40, 'El título no puede ser más largo de 40 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'Por favor ingrese una descripción'],
    maxlength: [200, 'La descripción no puede ser más larga de 200 caracteres']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Nota || mongoose.model('Nota', NotaSchema);