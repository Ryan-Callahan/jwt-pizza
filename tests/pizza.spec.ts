import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
    await page.route('*/**/api/auth', async (route) => {
      const loginReq = { email: 'd@jwt.com', password: 'diner' };
      const loginRes = {
          user: {
              id: 3,
              name: 'Kai Chen',
              email: 'd@jwt.com',
              roles: [{ role: 'diner' }],
          },
          token: 'abcdef',
      };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    });

    await page.route('*/**/api/user/me', async (route) => {
      const meRes = {
          user: {
              id: 3,
              name: 'Kai Chen',
              email: 'd@jwt.com',
              roles: [{ role: 'diner' }],
          },
          token: 'abcdef',
      };
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: meRes });
    });

    await page.route('*/**/api/order/menu', async (route) => {
      const menuRes = [
        {
          "id": 1,
          "title": "Veggie",
          "image": "pizza1.png",
          "price": 0.0038,
          "description": "A garden of delight"
        },
        {
          "id": 2,
          "title": "Pepperoni",
          "image": "pizza2.png",
          "price": 0.0042,
          "description": "Spicy treat"
        },
      ]
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: menuRes });
    });
    
    await page.route('*/**/api/franchise?page=0&limit=20&name=*', async (route) => {
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
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: franchiseRes });
    });

    await page.route('*/**/api/order', async (route) => {
      const orderReq = {
        "items": [
          {
            "menuId": 1,
            "description": "Veggie",
            "price": 0.0038
          },
          {
            "menuId": 2,
            "description": "Pepperoni",
            "price": 0.0042
          }
        ],
        "storeId": "2",
        "franchiseId": 1
      };
      const orderRes = {
        "order": {
          "items": [
            {
              "menuId": 1,
              "description": "Veggie",
              "price": 0.0038
            },
            {
              "menuId": 2,
              "description": "Pepperoni",
              "price": 0.0042
            }
          ],
          "storeId": "2",
          "franchiseId": 1,
          "id": 23
        },
        "jwt": "abduabfieabfiu"
      };
      expect(route.request().method()).toBe('POST');
      await route.fulfill({ json: orderRes });
    });

    await page.goto('http://localhost:5173/');
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
    await expect(page.locator('#navbar-dark')).toContainText('Login');
    await page.getByRole('button', { name: 'Order now' }).click();
    await page.getByRole('combobox').selectOption('2');
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByRole('heading')).toContainText('Welcome back');
    await page.getByRole('textbox', { name: 'Email address' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tfoot')).toContainText('2 pies');
    await page.getByRole('button', { name: 'Pay now' }).click();
    await expect(page.getByRole('heading')).toContainText('Here is your JWT Pizza!');
    await expect(page.getByRole('main')).toContainText('2');
});
