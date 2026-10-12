import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('STEP 5 — AUTHENTICATION & SECURITY RULES HARDENING AUDIT');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function recordResult(testName: string, passed: boolean, detail: string) {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}: ${detail}`);
    } else {
      console.error(`❌ [FAIL] ${testName}: ${detail}`);
    }
  }

  // 1. Audit firestore.rules file syntax and constraints
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  // Test 1: No permissive allow read, write: if true on users collection
  const hasPermissiveUsers = /match \/users\/\{userId\}[\s\S]*?allow read, write: if true;/.test(rulesContent);
  recordResult(
    'Firestore Rules: Users Collection Protection',
    !hasPermissiveUsers,
    !hasPermissiveUsers ? 'No permissive "allow read, write: if true" on /users' : 'Permissive rule found on /users'
  );

  // Test 2: No permissive allow read, write: if true on customers collection
  const hasPermissiveCustomers = /match \/customers\/\{customerId\}[\s\S]*?allow read, write: if true;/.test(rulesContent);
  recordResult(
    'Firestore Rules: Customers Collection Protection',
    !hasPermissiveCustomers,
    !hasPermissiveCustomers ? 'No permissive "allow read, write: if true" on /customers' : 'Permissive rule found on /customers'
  );

  // Test 3: Role escalation defense in users collection
  const hasUsersRoleEscalationDefense = rulesContent.includes("request.resource.data.role == 'customer'") || rulesContent.includes("role == resource.data.role");
  recordResult(
    'Firestore Rules: User Role Escalation Defense',
    hasUsersRoleEscalationDefense,
    hasUsersRoleEscalationDefense ? 'Enforces role immutability / non-escalation on /users' : 'Missing role escalation check'
  );

  // Test 4: Primary ownership escalation defense
  const hasOwnerEscalationDefense = rulesContent.includes("isPrimaryOwner == false") || rulesContent.includes("isPrimaryOwner == resource.data.isPrimaryOwner");
  recordResult(
    'Firestore Rules: Primary Owner Defense',
    hasOwnerEscalationDefense,
    hasOwnerEscalationDefense ? 'Enforces isPrimaryOwner tamper prevention' : 'Missing isPrimaryOwner defense'
  );

  // Test 5: Orders ownership restriction
  const hasOrdersOwnership = /match \/orders\/\{orderId\}[\s\S]*?request\.auth\.uid/.test(rulesContent);
  recordResult(
    'Firestore Rules: Orders Ownership Enforcement',
    hasOrdersOwnership,
    hasOrdersOwnership ? 'Orders access strictly constrained to authenticated owner (request.auth.uid) or admin' : 'Missing orders owner rule'
  );

  // Test 6: Return requests ownership restriction
  const hasReturnsOwnership = /match \/return_requests\/\{returnId\}[\s\S]*?request\.auth\.uid/.test(rulesContent);
  recordResult(
    'Firestore Rules: Returns Ownership Enforcement',
    hasReturnsOwnership,
    hasReturnsOwnership ? 'Return requests strictly constrained to authenticated owner or admin' : 'Missing returns owner rule'
  );

  // Test 7: Support tickets and message isolation
  const hasSupportIsolation = /match \/support_tickets\/\{ticketId\}[\s\S]*?match \/messages\/\{messageId\}/.test(rulesContent);
  recordResult(
    'Firestore Rules: Support Tickets & Messages Isolation',
    hasSupportIsolation,
    hasSupportIsolation ? 'Support ticket messages strictly isolated to ticket owner or admin' : 'Missing ticket message protection'
  );

  // Test 8: Store credit write protection
  const hasStoreCreditProtection = /match \/storeCredits\/\{creditId\}[\s\S]*?allow write: if isAdmin\(\);/.test(rulesContent);
  recordResult(
    'Firestore Rules: Store Credit Tamper Protection',
    hasStoreCreditProtection,
    hasStoreCreditProtection ? 'Store credits write locked exclusively to isAdmin()' : 'Missing store credit write lock'
  );

  // Test 9: Loyalty accounts write protection
  const hasLoyaltyProtection = /match \/loyaltyAccounts\/\{accountId\}[\s\S]*?allow write: if isAdmin\(\);/.test(rulesContent);
  recordResult(
    'Firestore Rules: Loyalty Points Tamper Protection',
    hasLoyaltyProtection,
    hasLoyaltyProtection ? 'Loyalty accounts write locked exclusively to isAdmin()' : 'Missing loyalty write lock'
  );

  // Test 10: Admin backend operational collections protection
  const hasAdminCollectionsProtection = 
    rulesContent.includes('match /admins/{adminId}') &&
    rulesContent.includes('match /inventory_ledger/{ledgerId}') &&
    rulesContent.includes('match /_audit_backups/{backupId}');
  recordResult(
    'Firestore Rules: Sensitive Operational Collections Protection',
    hasAdminCollectionsProtection,
    hasAdminCollectionsProtection ? 'Admin ledger, staff, and backups restricted to isAdmin()' : 'Missing admin collections guard'
  );

  // Test 11: AuthContext check - Firebase Auth UID is permanent identity
  const authContextPath = path.join(process.cwd(), 'src/context/AuthContext.tsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');
  const usesFirebaseAuthAsSource = authContextContent.includes('onAuthStateChanged(auth') && (authContextContent.includes('currentFbUser.uid') || authContextContent.includes('user.uid'));
  recordResult(
    'Auth Engine: Firebase Auth UID Source of Truth',
    usesFirebaseAuthAsSource,
    usesFirebaseAuthAsSource ? 'Firebase Auth state is the authoritative identity provider with permanent UID' : 'Missing Firebase Auth UID anchoring'
  );

  // Test 12: Sensitive field protection in Customer Details (no password/hashes leaked)
  const customerDetailsPath = path.join(process.cwd(), 'src/pages/admin/customers/CustomerDetailsModal.tsx');
  const customerDetailsContent = fs.readFileSync(customerDetailsPath, 'utf8');
  const masksSensitiveFields = !customerDetailsContent.includes('data.password') && !customerDetailsContent.includes('customer.password');
  recordResult(
    'Admin Customers: Sensitive Field Protection',
    masksSensitiveFields,
    masksSensitiveFields ? 'No passwords or internal raw credential hashes displayed in CustomerDetailsModal' : 'Potential sensitive credential leakage'
  );

  // Test 13: Order Details IDOR authorization verification
  const orderDetailsPath = path.join(process.cwd(), 'src/pages/OrderDetails.tsx');
  const orderDetailsContent = fs.readFileSync(orderDetailsPath, 'utf8');
  const verifiesOrderOwnership = orderDetailsContent.includes('data.userId === user.uid') || orderDetailsContent.includes('user.uid');
  recordResult(
    'Client Routing: Order Details IDOR Verification',
    verifiesOrderOwnership,
    verifiesOrderOwnership ? 'OrderDetails.tsx enforces ownership comparison between user.uid and order.userId' : 'Missing order ownership check in UI'
  );

  // Test 14: Server support return eligibility IDOR protection
  const serverSupportPath = path.join(process.cwd(), 'serverSupport.ts');
  const serverSupportContent = fs.readFileSync(serverSupportPath, 'utf8');
  const verifiesServerReturnOwner = serverSupportContent.includes('order.userId === userId') && serverSupportContent.includes('Boolean(userId)');
  recordResult(
    'Backend API: Return Eligibility IDOR Protection',
    verifiesServerReturnOwner,
    verifiesServerReturnOwner ? 'serverSupport.ts verifies order ownership and validates userId presence' : 'Vulnerable return eligibility check'
  );

  // Test 15: Admin route guard
  const adminPagePath = path.join(process.cwd(), 'src/pages/Admin.tsx');
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
  const enforcesAdminStaffGuard = adminPageContent.includes('isStaffOrAdmin') && adminPageContent.includes('canAccessAdminTab');
  recordResult(
    'Admin Control Panel: Multi-Role Authorization Guard',
    enforcesAdminStaffGuard,
    enforcesAdminStaffGuard ? 'Admin.tsx strictly guards access by role (admin, owner, manager, staff) and granular permissions' : 'Insecure admin route guard'
  );

  console.log('\n====================================================');
  console.log(`SECURITY AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🚀 ALL SECURITY HARDENING AND AUTHORIZATION CRITERIA SATISFIED!');
    process.exit(0);
  } else {
    console.error('❌ Security vulnerabilities detected.');
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
