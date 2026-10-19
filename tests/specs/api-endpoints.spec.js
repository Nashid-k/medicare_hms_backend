const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const app = require('../../app');

let server;
let baseUrl;

before(async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicare_hms';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

test('health endpoint responds and dashboard rejects requests without a role', async () => {
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.equal((await healthResponse.json()).status, 'Operational');

  const dashboardResponse = await fetch(`${baseUrl}/api/dashboard`);
  assert.equal(dashboardResponse.status, 401);
  assert.equal(
    (await dashboardResponse.json()).error,
    'Authentication role is required.'
  );
});

test('patient dashboard restricts other patients data, beds, and audit logs', async () => {
  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: {
      'x-user-role': 'patient',
      'x-patient-name': 'Marcus Vance'
    }
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.role, 'patient');
  assert.equal(data.beds.length, 0);
  assert.equal(data.inventory.length, 0);
  assert.equal(data.auditLogs.length, 0);
  assert.ok(data.patients.length <= 1);
});

test('doctor dashboard provides clinical metrics and restricts financial invoices and inventory', async () => {
  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: {
      'x-user-role': 'doctor',
      'x-user-name': 'Dr. Sarah Jenkins'
    }
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.role, 'doctor');
  assert.equal(data.invoices.length, 0);
  assert.equal(data.inventory.length, 0);
  assert.equal(data.stats.paidRevenue, undefined);
  assert.ok(data.stats.consultationsToday !== undefined);
  assert.ok(data.stats.urgentLabAlerts !== undefined);
});

test('receptionist dashboard sanitizes clinical data and restricts labs and prescriptions', async () => {
  const dashRes = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { 'x-user-role': 'receptionist' }
  });
  assert.equal(dashRes.status, 200);
  const dashData = await dashRes.json();
  assert.equal(dashData.role, 'receptionist');
  assert.equal(dashData.labs.length, 0);
  assert.equal(dashData.prescriptions.length, 0);
  assert.equal(dashData.inventory.length, 0);
  if (dashData.patients.length > 0) {
    const pt = dashData.patients[0];
    assert.equal(pt.clinicalNotes, undefined);
    assert.equal(pt.vitals, undefined);
    assert.equal(pt.diagnosis, undefined);
    assert.equal(pt.bloodGroup, undefined);
    assert.equal(pt.allergies, undefined);
  }

  const labsRes = await fetch(`${baseUrl}/api/labs`, {
    headers: { 'x-user-role': 'receptionist' }
  });
  assert.equal(labsRes.status, 403);
});

test('pharmacist dashboard provides inventory and pending prescriptions but restricts beds, labs, and patients', async () => {
  const dashRes = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { 'x-user-role': 'pharmacist' }
  });
  assert.equal(dashRes.status, 200);
  const dashData = await dashRes.json();
  assert.equal(dashData.role, 'pharmacist');
  assert.equal(dashData.beds.length, 0);
  assert.equal(dashData.labs.length, 0);
  assert.equal(dashData.patients.length, 0);
  assert.ok(dashData.stats.pendingRx !== undefined);
  assert.ok(dashData.stats.lowStockCount !== undefined);

  const labsRes = await fetch(`${baseUrl}/api/labs`, {
    headers: { 'x-user-role': 'pharmacist' }
  });
  assert.equal(labsRes.status, 403);
});

test('admin dashboard provides full operational and financial metrics', async () => {
  const dashRes = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { 'x-user-role': 'admin' }
  });
  assert.equal(dashRes.status, 200);
  const dashData = await dashRes.json();
  assert.equal(dashData.role, 'admin');
  assert.ok(dashData.stats.paidRevenue !== undefined);
  assert.ok(dashData.stats.bedOccupancyRate !== undefined);
  assert.ok(dashData.auditLogs.length > 0);
});
