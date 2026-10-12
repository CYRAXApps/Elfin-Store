const fs = require('fs');
const file = 'src/pages/admin/AdminReturnsManager.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('useAuth')) {
  code = code.replace(
    "import { ReturnRequest } from '../../types';",
    "import { ReturnRequest } from '../../types';\nimport { useAuth } from '../../context/AuthContext';"
  );
  
  code = code.replace(
    "const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);",
    "const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);\n  const { user } = useAuth();"
  );

  const oldUpdateStatus = `  const handleUpdateStatus = async (returnId: string, newStatus: string) => {
    if (!confirm(\`Are you sure you want to change the status to \${newStatus.replace(/_/g, ' ').toUpperCase()}?\`)) return;
    try {
      const ref = doc(db, 'return_requests', returnId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };`;

  const newUpdateStatus = `  const handleUpdateStatus = async (returnId: string, newStatus: string) => {
    if (!confirm(\`Are you sure you want to change the status to \${newStatus.replace(/_/g, ' ').toUpperCase()}?\`)) return;
    try {
      const ref = doc(db, 'return_requests', returnId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'admin'
      });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };`;

  code = code.replace(oldUpdateStatus, newUpdateStatus);
  fs.writeFileSync(file, code);
  console.log("AdminReturnsManager updated with useAuth");
} else {
  console.log("Already has useAuth");
}
