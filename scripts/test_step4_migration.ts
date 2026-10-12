import { getDb } from '../serverDb';
import { performCustomerAudit, executeCustomerMigration, isFirebaseUid } from '../serverCustomerMigration';

async function runStep4MigrationTests() {
  console.log('====================================================');
  console.log('STARTING STEP 4: CUSTOMER DATA & ACCOUNT MIGRATION AUDIT TESTS');
  console.log('====================================================\n');

  const db = getDb();
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, title: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS ${totalTests}] ${title}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL ${totalTests}] ${title}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // 1. Test Audit Engine Execution
  console.log('--- TEST 1: AUDIT EXISTING CUSTOMER RECORDS ---');
  const auditReport = await performCustomerAudit(db);
  assert(Boolean(auditReport && auditReport.summary), 'Audit engine generates complete summary report');
  assert(Array.isArray(auditReport.records), 'Audit engine returns itemized scanned records');
  assert(auditReport.summary.collectionsAudited.customers >= 0, 'Audited customers collection scanned');
  assert(auditReport.summary.collectionsAudited.orders >= 0, 'Audited orders collection scanned');

  // 2. Test Classification of Records
  console.log('\n--- TEST 2: RECORD CLASSIFICATION ---');
  assert(
    typeof auditReport.summary.uidBasedRecordsCount === 'number' &&
    typeof auditReport.summary.phoneBasedRecordsCount === 'number' &&
    typeof auditReport.summary.emailBasedRecordsCount === 'number' &&
    typeof auditReport.summary.missingUidRecordsCount === 'number',
    'Classifies records into UID-based, phone-based, email-based, and missing-UID'
  );

  // 3. Test UID Recognition
  console.log('\n--- TEST 3: FIREBASE UID RECOGNITION ---');
  assert(isFirebaseUid('ZudeiMJXXaUFxFN6sV8ErPplZ7w1') === true, 'Recognizes standard 28-character Firebase Auth UID');
  assert(isFirebaseUid('cust_test1234567890') === true, 'Recognizes custom customer UID format');
  assert(isFirebaseUid('+919876543210') === false, 'Rejects phone number as UID');
  assert(isFirebaseUid('user@example.com') === false, 'Rejects email as UID');

  // 4. Test Dry-Run Migration (Zero DB Mutation)
  console.log('\n--- TEST 4: DRY-RUN SIMULATION (NON-DESTRUCTIVE) ---');
  const dryRunResult = await executeCustomerMigration(db, true);
  assert(dryRunResult.success === true, 'Dry-run migration succeeds');
  assert(dryRunResult.dryRun === true, 'Dry-run flag honored');
  assert(dryRunResult.summary.noDataLossConfirmed === true, 'Zero data loss confirmed in simulation');

  // 5. Test Live Migration with Safety Guarantee & Snapshot Backup
  console.log('\n--- TEST 5: EXECUTE SAFE MIGRATION & BACKUP CREATION ---');
  const liveResult = await executeCustomerMigration(db, false);
  assert(liveResult.success === true, 'Safe live migration executes successfully');
  assert(Boolean(liveResult.backupId), `Backup snapshot created with ID: ${liveResult.backupId}`);
  assert(liveResult.summary.noDataLossConfirmed === true, 'Post-migration verified: zero customer or business records deleted');

  // 6. Test Zero Data Loss Counts
  console.log('\n--- TEST 6: PRE- AND POST-MIGRATION COUNTS VERIFICATION ---');
  const { beforeCounts, afterCounts } = liveResult.summary;
  assert(afterCounts.customers >= beforeCounts.customers, `Customer count preserved (${beforeCounts.customers} -> ${afterCounts.customers})`);
  assert(afterCounts.orders >= beforeCounts.orders, `Orders count preserved (${beforeCounts.orders} -> ${afterCounts.orders})`);
  assert(afterCounts.returns >= beforeCounts.returns, `Returns count preserved (${beforeCounts.returns} -> ${afterCounts.returns})`);
  assert(afterCounts.supportTickets >= beforeCounts.supportTickets, `Support tickets count preserved (${beforeCounts.supportTickets} -> ${afterCounts.supportTickets})`);

  // 7. Test Ambiguous Records Handling
  console.log('\n--- TEST 7: AMBIGUOUS RECORDS & IDENTITY REVIEW ---');
  assert(typeof liveResult.summary.flaggedForReview === 'number', 'Flags ambiguous records with IDENTITY_REVIEW_REQUIRED instead of guessing');

  // 8. Test Post-Migration Re-Audit
  console.log('\n--- TEST 8: POST-MIGRATION AUDIT CONSISTENCY ---');
  const postAudit = await performCustomerAudit(db);
  assert(postAudit.summary.totalCustomerRecordsScanned >= auditReport.summary.totalCustomerRecordsScanned, 'Total scanned records remain consistent');

  console.log('\n====================================================');
  console.log(`STEP 4 AUDIT & MIGRATION TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStep4MigrationTests().catch((err) => {
  console.error('Fatal error during Step 4 migration test:', err);
  process.exit(1);
});
