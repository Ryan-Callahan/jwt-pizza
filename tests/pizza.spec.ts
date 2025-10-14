import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';
import { Role, User } from '../src/service/pizzaService';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('docs', async ({ page }) => {
  await page.goto('/docs');
  await expect(page.getByRole('main')).toContainText('JWT Pizza API');
});

test('footer links', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('list')).toContainText('about');
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('list')).toContainText('history');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByRole('list')).toContainText('franchise-dashboard');
});

test('register', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await expect(page.getByRole('heading')).toContainText('Welcome to the party');
  await page.getByRole('textbox', { name: 'Full name' }).fill('Kai Chen');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Logout');
  await expect(page.getByLabel('Global')).toContainText('t');
});

test('login, logout', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();

  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await expect(page.getByText('d@jwt.com')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('d@jwt.com');
  await expect(page.getByRole('main')).toContainText('diner');
  await expect(page.locator('tbody')).toContainText('5');
  await expect(page.locator('tbody')).toContainText('2025-10-13T20:58:29.000Z');

  await expect(page.locator('#navbar-dark')).toContainText('Logout');
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Login');
  await expect(page.locator('#navbar-dark')).toContainText('Register');
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('admin dashboard', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Admin');
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.locator('h2')).toContainText('Mama Ricci\'s kitchen');
  await expect(page.locator('h3')).toContainText('Franchises');
  await expect(page.locator('tbody')).toContainText('pizzaPocket');
});

test('create/close franchise', async ({ page }) => {

});

test('create/close store', async ({ page }) => {

});

test('delivery', async ({ page }) => {

});

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] } };

  // Authorize login for the given user
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    if (method === 'POST' || method === 'PUT') {
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = validUsers[loginReq.email];
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

  // Order a pizza.
  await page.route('*/**/api/order', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: 'eyJpYXQ',
      };
      expect(route.request().method()).toBe('POST');
      await route.fulfill({ json: orderRes });
    }
    else if (method === 'GET') {
      const orderRes = {
        "dinerId": 2,
        "orders": [
          {
            "id": 5,
            "franchiseId": 1,
            "storeId": 2,
            "date": "2025-10-13T20:58:29.000Z",
            "items": [
              {
                "id": 5,
                "menuId": 1,
                "description": "Veggie",
                "price": 0.0038
              },
              {
                "id": 6,
                "menuId": 2,
                "description": "Pepperoni",
                "price": 0.0042
              }
            ]
          },
        ],
        "page": 1
      };
      await route.fulfill({ json: orderRes });
    }
  });

  await page.goto('/');
}

async function adminInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 'a@jwt.com': { id: '3', name: 'Kai Chen', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] } };

  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    const loginReq = route.request().postDataJSON();
    const user = validUsers[loginReq.email];
    if (!user || user.password !== loginReq.password) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      return;
    }
    loggedInUser = validUsers[loginReq.email];
    const loginRes = {
      user: loggedInUser,
      token: 'abcdef',
    };
    expect(route.request().method()).toBe('PUT');
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise?page=0&limit=3&name=*', async (route) => {
    const franchiseRes = {
      "franchises": [
        {
          "id": 1,
          "name": "pizzaPocket",
          "stores": [
            {
              "id": 2,
              "name": "SOUP"
            }
          ]
        }
      ],
      "more": false
    }
    await route.fulfill({ json: franchiseRes });
  });

  await page.goto('/');
}
