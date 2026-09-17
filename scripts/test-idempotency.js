/**
 * Automated Idempotency Key Middleware Test
 * Tests that duplicate requests with the same X-Idempotency-Key are safely replayed without double-execution.
 * Uses native fetch (zero dependencies).
 */

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';
const TENANT_ID = 1;
const TEST_PRODUCT_ID = 88888;
const WAREHOUSE_ID = 1;
const TEST_IDEMPOTENCY_KEY = `test-key-${Date.now()}`;

async function runIdempotencyTest() {
  console.log('================================================================');
  console.log('🧪 RUNNING IDEMPOTENCY KEY MIDDLEWARE TEST');
  console.log('================================================================\n');

  try {
    // Step 1: Initialize stock to 50
    console.log(`📦 [Step 1] Initializing Product #${TEST_PRODUCT_ID} with 50 units...`);
    await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/init-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': String(TENANT_ID)
      },
      body: JSON.stringify({
        productId: TEST_PRODUCT_ID,
        productCode: 'IDEMP-TEST-SKU',
        productName: 'Idempotency Test Item',
        warehouseId: WAREHOUSE_ID,
        initialStock: 50,
        minimumStock: 5
      })
    });

    // Also adjust to ensure current_stock is strictly 50
    await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': String(TENANT_ID),
        'x-user-role': 'ADMIN',
        'x-user-permissions': '["*"]'
      },
      body: JSON.stringify({
        productId: TEST_PRODUCT_ID,
        warehouseId: WAREHOUSE_ID,
        adjustmentType: 'SET',
        quantity: 50,
        reason: 'Automated Idempotency Baseline'
      })
    });

    console.log('✅ Base stock established at 50 units.\n');

    // Step 2: Send 1st Request with X-Idempotency-Key
    console.log(`📡 [Step 2] Sending 1st Request (Deduct 5 units) with Key: "${TEST_IDEMPOTENCY_KEY}"...`);
    const res1 = await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': String(TENANT_ID),
        'x-idempotency-key': TEST_IDEMPOTENCY_KEY
      },
      body: JSON.stringify({
        productId: TEST_PRODUCT_ID,
        warehouseId: WAREHOUSE_ID,
        quantity: 5,
        movementType: 'SALE',
        referenceType: 'IDEMP_TEST_1',
        referenceId: 'IDEMP-REF-1',
        notes: 'First attempt'
      })
    });

    const data1 = await res1.json();
    const replayedHeader1 = res1.headers.get('x-idempotent-replayed') || 'false';

    console.log(`   - Status: ${res1.status} OK`);
    console.log(`   - Is Replayed: ${replayedHeader1}`);
    console.log(`   - Stock Returned: ${data1?.data?.stock?.current_stock} units\n`);

    // Step 3: Send 2nd Request with IDENTICAL X-Idempotency-Key (Simulating user double-click or network retry)
    console.log(`📡 [Step 3] Sending 2nd DUPLICATE Request with IDENTICAL Key: "${TEST_IDEMPOTENCY_KEY}"...`);
    const res2 = await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': String(TENANT_ID),
        'x-idempotency-key': TEST_IDEMPOTENCY_KEY
      },
      body: JSON.stringify({
        productId: TEST_PRODUCT_ID,
        warehouseId: WAREHOUSE_ID,
        quantity: 5,
        movementType: 'SALE',
        referenceType: 'IDEMP_TEST_2',
        referenceId: 'IDEMP-REF-2',
        notes: 'Second attempt (duplicate click)'
      })
    });

    const data2 = await res2.json();
    const replayedHeader2 = res2.headers.get('x-idempotent-replayed') || 'false';

    console.log(`   - Status: ${res2.status} OK`);
    console.log(`   - Header 'x-idempotent-replayed': ${replayedHeader2}`);
    console.log(`   - Response Body matches 1st request: ${JSON.stringify(data1) === JSON.stringify(data2)}`);

    // Step 4: Verify stock in database to ensure it was only deducted ONCE (50 - 5 = 45, NOT 40)
    console.log(`\n🔍 [Step 4] Verifying Final Database Stock...`);
    const checkRes = await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/check-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': String(TENANT_ID)
      },
      body: JSON.stringify({
        items: [{ productId: TEST_PRODUCT_ID, warehouseId: WAREHOUSE_ID, quantity: 1 }]
      })
    });

    const checkData = await checkRes.json();
    const finalStock = checkData?.data?.items?.[0]?.availableQuantity;
    console.log(`   - Final Available Stock: ${finalStock} units (Expected: 45, NOT 40)\n`);

    const isReplayed = String(replayedHeader2).toLowerCase() === 'true';
    if (isReplayed && finalStock === 45) {
      console.log('🏆 [PASSED] IDEMPOTENCY KEY TEST SUCCESSFUL!');
      console.log('   Duplicate request was intercepted, no double deduction occurred, and cached result was replayed seamlessly.');
    } else {
      console.error('❌ [FAILED] Idempotency verification failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

runIdempotencyTest();
