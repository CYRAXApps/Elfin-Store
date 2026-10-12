import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { OrderHelpModal } from '../components/account/OrderHelpModal';
import { OrdersSubView } from '../components/account/OrdersSubView';
import { AccountLayout } from '../components/account/AccountLayout';

// In-memory cache for user's orders
let cachedUserOrders: { uid: string; orders: Order[] } | null = null;

export function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.uid;
  const [orders, setOrders] = useState<Order[]>(() => {
    if (cachedUserOrders && userId && cachedUserOrders.uid === userId) {
      return cachedUserOrders.orders;
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (cachedUserOrders && userId && cachedUserOrders.uid === userId) {
      return false;
    }
    return true;
  });
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedHelpOrder, setSelectedHelpOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      fetchedOrders.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
      setOrders(fetchedOrders);
      cachedUserOrders = { uid: userId, orders: fetchedOrders };
      setLoading(false);
    }, (error) => {
      console.warn("Notice fetching orders:", error?.message || error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <AccountLayout activeView="orders" title="My Orders">
      <OrdersSubView
        orders={orders}
        loading={loading}
        onOpenInvoice={setSelectedInvoiceOrder}
        onOpenHelp={setSelectedHelpOrder}
      />

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Order Help Modal */}
      {selectedHelpOrder && user && (
        <OrderHelpModal
          order={selectedHelpOrder}
          userId={user.uid}
          userEmail={user.email || ''}
          userName={user.displayName || ''}
          onClose={() => setSelectedHelpOrder(null)}
          onTicketCreated={() => {
            navigate('/account?view=tickets');
          }}
          onReturnInitiated={() => {
            navigate('/account?view=returns');
          }}
        />
      )}
    </AccountLayout>
  );
}
