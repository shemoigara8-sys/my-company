const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const services = [
  {
    name: 'BlackWolf AI',
    description: 'AI assistants for customer support, operations, school administration, and business workflows.'
  },
  {
    name: 'BlackWolf Docs',
    description: 'Digitize documents, generate PDFs, automate reports, and extract insights from forms and files.'
  },
  {
    name: 'BlackWolf Flow',
    description: 'Online forms, business process automation, approvals, and workflow coordination tools.'
  },
  {
    name: 'BlackWolf Studio',
    description: 'Modern websites, SaaS landing pages, and digital experiences for fast-growing brands.'
  },
  {
    name: 'BlackWolf Geo',
    description: 'Geospatial intelligence, mapping, and data-driven field and infrastructure intelligence.'
  }
];

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'BlackWolf Technologies',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/services', (req, res) => {
  res.json({ services });
});

app.post('/api/contact', (req, res) => {
  const { name, email, company, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.'
    });
  }

  const lead = {
    id: Date.now().toString(),
    name,
    email,
    company: company || 'Not provided',
    message,
    createdAt: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    message: 'Thank you. Your inquiry has been received and the team will reach out shortly.',
    lead
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`BlackWolf Technologies server is running on http://localhost:${PORT}`);
});
