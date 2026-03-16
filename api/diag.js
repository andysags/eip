module.exports = (req, res) => {
  res.json({ 
    status: "ok", 
    message: "API infrastructure is working",
    timestamp: new Date().toISOString()
  });
};
