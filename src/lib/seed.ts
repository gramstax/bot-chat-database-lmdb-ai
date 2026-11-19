import type {ITable} from "~/types/dbchat"

/**
 * The demo dataset, seeded into LMDB on first run.
 *
 * Three small, realistic tables — enough that every demo question in the
 * README works: "Which tables are available?", "How many orders are
 * there?", "Total revenue by product?", "List customers from Jakarta".
 *
 * To use your own data, replace this file's tables (same shape) and delete
 * the LMDB data directory (`DB_PATH`, default `./data`) so the bot reseeds
 * on the next start. The schema registry is the tables themselves: what
 * `/tables` and `/schema` show is exactly what is stored here.
 */
export function demoTables(): ITable[] {
  return [
    {
      name: `customers`,
      description: `People who buy from the store`,
      columns: [
        {name: `id`, type: `integer`},
        {name: `name`, type: `string`},
        {name: `email`, type: `string`},
        {name: `city`, type: `string`},
        {name: `created_at`, type: `date`},
      ],
      rows: [
        {id: 1, name: `Andi Pratama`, email: `andi@mail.com`, city: `Jakarta`, created_at: `2026-09-02`},
        {id: 2, name: `Sari Wijaya`, email: `sari@mail.com`, city: `Jakarta`, created_at: `2026-09-05`},
        {id: 3, name: `Budi Santoso`, email: `budi@mail.com`, city: `Bandung`, created_at: `2026-09-08`},
        {id: 4, name: `Maya Chen`, email: `maya@mail.com`, city: `Jakarta`, created_at: `2026-09-11`},
        {id: 5, name: `Rizky Hidayat`, email: `rizky@mail.com`, city: `Surabaya`, created_at: `2026-09-14`},
        {id: 6, name: `Dewi Lestari`, email: `dewi@mail.com`, city: `Bandung`, created_at: `2026-09-17`},
        {id: 7, name: `James Miller`, email: `james@mail.com`, city: `Singapore`, created_at: `2026-09-20`},
        {id: 8, name: `Yuki Tanaka`, email: `yuki@mail.com`, city: `Tokyo`, created_at: `2026-09-23`},
        {id: 9, name: `Agus Setiawan`, email: `agus@mail.com`, city: `Jakarta`, created_at: `2026-09-26`},
        {id: 10, name: `Ratna Sari`, email: `ratna@mail.com`, city: `Surabaya`, created_at: `2026-09-29`},
        {id: 11, name: `Kevin Tan`, email: `kevin@mail.com`, city: `Singapore`, created_at: `2026-10-02`},
        {id: 12, name: `Putri Ayu`, email: `putri@mail.com`, city: `Yogyakarta`, created_at: `2026-10-05`},
      ],
    },
    {
      name: `products`,
      description: `Items the store sells (prices in IDR)`,
      columns: [
        {name: `id`, type: `integer`},
        {name: `name`, type: `string`},
        {name: `category`, type: `string`},
        {name: `price`, type: `number`, note: `price in IDR`},
        {name: `stock`, type: `integer`},
      ],
      rows: [
        {id: 1, name: `Wireless Mouse`, category: `Electronics`, price: 249000, stock: 42},
        {id: 2, name: `Mechanical Keyboard`, category: `Electronics`, price: 899000, stock: 18},
        {id: 3, name: `Office Chair`, category: `Furniture`, price: 1499000, stock: 7},
        {id: 4, name: `Standing Desk`, category: `Furniture`, price: 3299000, stock: 5},
        {id: 5, name: `Arabica Coffee 250g`, category: `Groceries`, price: 85000, stock: 120},
        {id: 6, name: `Green Tea Box`, category: `Groceries`, price: 45000, stock: 0},
        {id: 7, name: `Running Shoes`, category: `Apparel`, price: 1299000, stock: 23},
        {id: 8, name: `Cotton T-Shirt`, category: `Apparel`, price: 149000, stock: 86},
        {id: 9, name: `USB-C Hub`, category: `Electronics`, price: 399000, stock: 31},
        {id: 10, name: `Desk Lamp`, category: `Furniture`, price: 279000, stock: 14},
      ],
    },
    {
      name: `orders`,
      description: `Customer purchases (total = quantity x product price)`,
      columns: [
        {name: `id`, type: `integer`},
        {name: `customer_id`, type: `integer`, note: `references customers.id`},
        {name: `product_id`, type: `integer`, note: `references products.id`},
        {name: `quantity`, type: `integer`},
        {name: `total`, type: `number`, note: `total in IDR`},
        {name: `ordered_at`, type: `date`},
      ],
      rows: [
        {id: 1, customer_id: 1, product_id: 1, quantity: 2, total: 498000, ordered_at: `2026-10-02`},
        {id: 2, customer_id: 2, product_id: 5, quantity: 3, total: 255000, ordered_at: `2026-10-03`},
        {id: 3, customer_id: 4, product_id: 2, quantity: 1, total: 899000, ordered_at: `2026-10-05`},
        {id: 4, customer_id: 1, product_id: 7, quantity: 1, total: 1299000, ordered_at: `2026-10-07`},
        {id: 5, customer_id: 3, product_id: 1, quantity: 1, total: 249000, ordered_at: `2026-10-09`},
        {id: 6, customer_id: 5, product_id: 3, quantity: 1, total: 1499000, ordered_at: `2026-10-11`},
        {id: 7, customer_id: 9, product_id: 5, quantity: 5, total: 425000, ordered_at: `2026-10-12`},
        {id: 8, customer_id: 2, product_id: 9, quantity: 2, total: 798000, ordered_at: `2026-10-14`},
        {id: 9, customer_id: 7, product_id: 4, quantity: 1, total: 3299000, ordered_at: `2026-10-18`},
        {id: 10, customer_id: 10, product_id: 8, quantity: 4, total: 596000, ordered_at: `2026-10-20`},
        {id: 11, customer_id: 4, product_id: 1, quantity: 3, total: 747000, ordered_at: `2026-10-22`},
        {id: 12, customer_id: 6, product_id: 10, quantity: 2, total: 558000, ordered_at: `2026-10-24`},
        {id: 13, customer_id: 8, product_id: 2, quantity: 1, total: 899000, ordered_at: `2026-10-27`},
        {id: 14, customer_id: 11, product_id: 7, quantity: 2, total: 2598000, ordered_at: `2026-10-29`},
        {id: 15, customer_id: 12, product_id: 5, quantity: 2, total: 170000, ordered_at: `2026-11-02`},
        {id: 16, customer_id: 1, product_id: 9, quantity: 1, total: 399000, ordered_at: `2026-11-05`},
      ],
    },
  ]
}
