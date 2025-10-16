import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';
import { Role, User } from '../src/service/pizzaService';

test('updateUser', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('Kai Chen');
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'KC' }).click();

  await expect(page.getByRole('main')).toContainText('Kai Chen');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('Kai Chenx');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('Kai Chenx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'KC' }).click();

  await expect(page.getByRole('main')).toContainText('Kai Chenx');
});

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  let validUser: User = { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] };

  // Authorize login for the given user
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    if (method === 'POST' || method === 'PUT') {
      const loginReq = route.request().postDataJSON();
      const user = validUser;
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = validUser;
      const loginRes = {
        user: loggedInUser,
        token: 'abcdef',
      };
      expect(route.request().method() === 'PUT' ||
        route.request().method() === 'POST').toBe(true);
      await route.fulfill({ json: loginRes });
    }
    else if (method === 'DELETE') {
      const authRes = {
        "message": "logout successful"
      };
      await route.fulfill({ json: authRes });
    }
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/user/3', async (route) => {
    const userUpdateReq = route.request().postDataJSON();
    validUser.name = userUpdateReq.name;
    validUser.email = userUpdateReq.email;
    await route.fulfill({ json: { validUser } })
  });

  await page.route('*/**/api/order', async (route) => {
    await route.fulfill({ json: {} })
  });

  await page.goto('/');
}