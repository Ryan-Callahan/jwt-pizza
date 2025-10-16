import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';
import { Role, User } from '../src/service/pizzaService';

test('admins can list users', async ({ page }) => {
  await basicInit(page);
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
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.coma');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).press('ArrowRight');
  await page.getByRole('textbox', { name: 'Email address' }).press('ArrowRight');
  await page.getByRole('textbox', { name: 'Email address' }).press('ArrowRight');
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('main')).toContainText('pizza diner');
  await expect(page.getByRole('main')).toContainText('Delete');
  await page.getByRole('row', { name: 'pizza diner 42flk7a6ar@test.' }).getByRole('button').click();
  await expect(page.getByRole('heading')).toContainText('Are you sure you want to delete this user?');
  await expect(page.getByRole('main')).toContainText('pizza diner');
  await expect(page.getByRole('main')).toContainText('Delete User');
  await page.getByRole('button', { name: 'Delete User' }).click();
  await expect(page.locator('h2')).toContainText('Mama Ricci\'s kitchen');
});

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 'a@jwt.com': { id: '3', name: 'Kai Chen', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] } };
  let franchises = [{
          "id": 1,
          "name": "pizzaPocket",
          "admins": [
            {
              "id": 3,
              "name": "pizza franchisee",
              "email": "f@jwt.com"
            }
          ],
          "stores": [
            {
              "id": 2,
              "name": "SOUP"
            }
          ]
        }];

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
      "franchises": franchises,
      "more": false
    }
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });
  
   await page.route('*/**/api/user?page=0&limit=5&name=*', async (route) => {
    const listUserRes = {
      "users": [
        {
          "id": 1,
          "name": "常用名字",
          "email": "a@jwt.com",
          "roles": [
            {
              "role": "admin"
            },
            {
              "objectId": 31,
              "role": "franchisee"
            }
          ]
        },
        {
          "id": 2,
          "name": "pizza franchisee",
          "email": "f@jwt.com",
          "roles": [
            {
              "role": "diner"
            },
            {
              "objectId": 1,
              "role": "franchisee"
            }
          ]
        },
        {
          "id": 3,
          "name": "pizza diner",
          "email": "42flk7a6ar@test.com",
          "roles": [
            {
              "role": "diner"
            }
          ]
        },
        {
          "id": 4,
          "name": "pafeff",
          "email": "afefeafeafa@test.com",
          "roles": [
            {
              "role": "diner"
            }
          ]
        },
        {
          "id": 5,
          "name": "feafe diner",
          "email": "afdafe@test.com",
          "roles": [
            {
              "role": "diner"
            }
          ]
        }
      ], 
      more: true
    }
    await route.fulfill({ json: listUserRes });
  });

  await page.route('*/**/api/user?page=1&limit=5&name=*', async (route) => {
    const listUserRes = {
      "users": [
                {
          "id": 6,
          "name": "vaefafa diner",
          "email": "faefeafa@test.com",
          "roles": [
            {
              "role": "diner"
            }
          ]
        },
        {
          "id": 7,
          "name": "sfdsfdsc diner",
          "email": "42caecaeflk7a6ar@test.com",
          "roles": [
            {
              "role": "diner"
            }
          ]
        }
      ], 
      more: false
    }
    await route.fulfill({ json: listUserRes });
  });

  await page.route('*/**/api/user/3', async (route) => {
    const deleteUserRes = {
      message: "user deleted"
    };
    await route.fulfill({ json: deleteUserRes });
  });

  await page.goto('/');
}