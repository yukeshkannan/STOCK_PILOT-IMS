/**
 * Automated Concurrency Control & Pessimistic Locking Test
 * Tests that simultaneous checkout / stock deduction requests cannot cause race conditions or overselling.
 * Uses native fetch (zero dependencies).
 */

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';
const TENANT_ID = 1;
const TEST_PRODUCT_ID = 99999;
const WAREHOUSE_ID = 1;

async function runConcurrencyTest() {
  console.log('================================================================');
  console.log('🧪 RUNNING PESSIMISTIC LOCKING & CONCURRENCY CONTROL TEST');
  console.log('================================================================\n');

  try {
    // Step 1: Set product initial stock to exactly 1
    console.log(`📦 [Step 1] Initializing Product #${TEST_PRODUCT_ID} with EXACTLY 1 unit in stock...`);
    const initRes = await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/init-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': String(TENANT_ID)
      },
      body: JSON.stringify({
        productId: TEST_PRODUCT_ID,
        productCode: 'CONCURRENCY-TEST-SKU',
        productName: 'Concurrency Test Item (1 Unit)',
        warehouseId: WAREHOUSE_ID,
        initialStock: 1,
        minimumStock: 0
      })
    });

    if (!initRes.ok) {
      console.warn('Init stock status:', initRes.status);
    }

    // Also adjust to ensure current_stock is strictly 1
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
        quantity: 1,
        reason: 'Automated Concurrency Baseline'
      })
    });

    console.log('✅ Baseline stock initialized to 1 unit.\n');

    // Step 2: Fire 10 simultaneous stock deduction requests concurrently in parallel
    const CONCURRENT_REQUESTS = 10;
    console.log(`🚀 [Step 2] Firing ${CONCURRENT_REQUESTS} parallel checkout requests at the exact same millisecond...`);

    const promises = [];
    for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
      promises.push(
        fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': String(TENANT_ID)
          },
          body: JSON.stringify({
            productId: TEST_PRODUCT_ID,
            warehouseId: WAREHOUSE_ID,
            quantity: 1,
            movementType: 'SALE',
            referenceType: 'CONCURRENCY_TEST',
            referenceId: `TEST-REQ-${i}`,
            notes: `Parallel request #${i}`,
            createdBy: `Tester-${i}`
          })
        }).then(async (res) => {
          const data = await res.json().catch(() => ({}));
          return {
            reqId: i,
            status: res.status,
            data,
            success: res.ok
          };
        }).catch((err) => ({
          reqId: i,
          status: 500,
          error: err.message,
          success: false
        }))
      );
    }

    const results = await Promise.all(promises);

    // Step 3: Analyze results
    const successfulRequests = results.filter((r) => r.success);
    const failedRequests = results.filter((r) => !r.success);

    console.log(`\n📊 [Step 3] Concurrent Request Results:`);
    console.log(`   - Successful Checkouts: ${successfulRequests.length} (Expected: 1)`);
    console.log(`   - Rejected / Blocked Checkouts: ${failedRequests.length} (Expected: ${CONCURRENT_REQUESTS - 1})`);

    // Verify stock availability
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
    const remainingStock = checkData?.data?.items?.[0]?.availableQuantity ?? 0;
    console.log(`   - Remaining Available Stock in DB: ${remainingStock} units (Expected: 0)\n`);

    if (successfulRequests.length === 1 && failedRequests.length === (CONCURRENT_REQUESTS - 1) && remainingStock === 0) {
      console.log('🏆 [PASSED] CONCURRENCY TEST SUCCESSFUL!');
      console.log('   Pessimistic locking and atomic condition checks completely prevented race conditions and overselling.');
    } else {
      console.error('❌ [FAILED] Concurrency race condition detected!');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

runConcurrencyTest();
