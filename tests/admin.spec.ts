import { test, expect } from 'playwright-test-coverage';

test('admins can list users', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  await expect(page.getByRole('main')).toContainText('Users');
  await expect(page.getByRole('main')).toContainText('Name');
  await expect(page.getByRole('main')).toContainText('Submit');
  await page.getByRole('button', { name: '»' }).first().click();

  await page.getByRole('button', { name: '«' }).first().click();
  await page.getByRole('textbox', { name: 'Filter users' }).click();
  await page.getByRole('textbox', { name: 'Filter users' }).fill('blah');
  await page.getByRole('cell', { name: 'blah Submit' }).getByRole('button').click();
  await page.getByRole('textbox', { name: 'Filter users' }).click();
  await page.getByRole('textbox', { name: 'Filter users' }).fill('');
  await page.getByRole('button', { name: 'Submit' }).first().click();
});

test('admin can delete users', async ({ page }) => {

});