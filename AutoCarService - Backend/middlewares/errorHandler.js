function errorHandler(err, req, res, next) {
    console.error(err.stack);
  
    const status = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';
  
    res.status(status).json({ error: message });
  }
  
  module.exports = errorHandler;
  