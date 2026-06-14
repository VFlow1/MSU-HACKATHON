module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || ""
  });
};
