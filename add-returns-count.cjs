const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');

if (!code.includes('const [returnsCount, setReturnsCount] = useState(0);')) {
  const insertState = `  const [returnsCount, setReturnsCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'return_requests'), (snap) => {
      setReturnsCount(snap.docs.filter(d => !['closed', 'rejected', 'cancelled'].includes(d.data().status)).length);
    });
    return () => unsubscribe();
  }, []);`;
  
  code = code.replace('  // Filter State', insertState + '\n\n  // Filter State');
  
  code = code.replace(/refunded: orders\.filter\(\(o\) => o\.status === 'refunded' \|\| o\.payment\?\.paymentStatus === 'refunded'\)\.length/, 
    `refunded: orders.filter((o) => o.status === 'refunded' || o.payment?.paymentStatus === 'refunded').length,
      returns: returnsCount`);
      
  fs.writeFileSync('src/pages/admin/AdminOrders.tsx', code);
  console.log("Added returns count");
}
