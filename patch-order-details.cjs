const fs = require('fs');

// Patch OrderDetails
let odContent = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');
odContent = odContent.replace(
  'to="/account?view=reviews"',
  'to={`/product/${item.productId}?tab=reviews`}'
);
fs.writeFileSync('src/pages/OrderDetails.tsx', odContent);

// Patch ProductDetails to read tab from query params
let pdContent = fs.readFileSync('src/pages/ProductDetails.tsx', 'utf8');

pdContent = pdContent.replace(
  "import { useParams, useNavigate, Link } from 'react-router-dom';",
  "import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';"
);

pdContent = pdContent.replace(
  "  const [activeTab, setActiveTab] = useState('description');",
  "  const [searchParams] = useSearchParams();\n  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'description');"
);

fs.writeFileSync('src/pages/ProductDetails.tsx', pdContent);
console.log('Patched OrderDetails.tsx and ProductDetails.tsx');
