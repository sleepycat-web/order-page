import { MenuItem } from "../components/menu";

export const menuItems: MenuItem[] = [
  //Beverages Done
  {
    name: "Beverages",
    price: "30.00",
    customizationOptions: [
      {
        name: "Select Beverage",
        type: "radio",
        options: [
          { label: "Water (1LTR)", price: "30.00" },

          { label: "Coca Cola", price: "50.00" },
          { label: "Pepsi", price: "50.00" },
          { label: "Fanta", price: "50.00" },
          { label: "Slice", price: "50.00" },
          { label: "Limca", price: "50.00" },
          { label: "Mountain Dew", price: "50.00" },
          { label: "Masala Coke", price: "70.00" },
          { label: "Fresh Lime Water", price: "90.00" },
          { label: "Fresh Lime Soda", price: "100.00" },
          { label: "Sweet Lassi", price: "100.00" },
          { label: "Spicy Lassi", price: "100.00" },
          { label: "Mango Juice", price: "100.00" },
          { label: "Litchi Juice", price: "100.00" },
          { label: "Cantaloupe Juice", price: "100.00" },
          { label: "BlackCurrant Juice", price: "100.00" },
          { label: "Cranberry Juice", price: "100.00" },
          { label: "Kiwi Juice", price: "100.00" },
          { label: "Brazillian Lemonade", price: "200.00" },
        ],
      },
      {
        name: "Temperature",
        type: "radio",
        options: [{ label: "Normal" }, { label: "Chilled" }],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Sugar" },
          { label: "Salt" },
          { label: "Black Salt" },
          { label: "Chat Masala", price: "10.00" },
          { label: "Roasted Cumin", price: "10.00" },
          { label: "Lemon", price: "20.00" },
          { label: "Kesar", price: "30.00" },
          { label: "Vanilla Icecream", price: "50.00" },
          { label: "Strawberry Icecream", price: "50.00" },
          { label: "Chocolate Icecream", price: "50.00" },
          { label: "DryFruit Mix", price: "50.00" },
        ],
      },
    ],
  },
  // Bread Done
  {
    name: "Bread/Bun",
    price: "30.00",
    customizationOptions: [
      {
        name: "Choose Bite",
        type: "radio",
        options: [{ label: "Bread" }, { label: "Bun" }],
      },
      {
        name: "Texture",
        type: "radio",
        options: [
          { label: "Raw", price: "30.00" },
          { label: "Butter Toast", price: "60.00" },
          { label: "GingerGarlic Toast", price: "80.00" },
          { label: "Cheese Chilli Toast", price: "100.00" },

          { label: "Milk Toast", price: "100.00" },
          { label: "Caramel Toast", price: "130.00" },
          { label: "Strawberry Toast", price: "130.00" },
          { label: "Chocolate Toast", price: "130.00" },

          { label: "French Toast", price: "150.00" },
        ],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Sugar" },
          { label: "Black Pepper" },
          { label: "Black Salt" },
          { label: "Chat Masala", price: "10.00" },
          { label: "Green Chutney", price: "10.00" },
          { label: "Tomato Sauce", price: "10.00" },
          { label: "Salted Butter", price: "20.00" },
          { label: "Mayonnaise", price: "20.00" },
          { label: "PeriPeri Seasoning", price: "20.00" },
          { label: "MixFruit Jam", price: "20.00" },
          { label: "Pineapple Jam", price: "20.00" },
          { label: "Honey", price: "30.00" },
          { label: "MilkMaid", price: "30.00" },
          { label: "Peanut Butter", price: "30.00" },
          { label: "Boiled Egg (2PCS)", price: "40.00" },
          { label: "Poached Egg", price: "40.00" },
          { label: "DryFruit Mix", price: "50.00" },

          { label: "Plain Omelette", price: "40.00" },
          { label: "Masala Omelette", price: "80.00" },
          { label: "Hazelnut Spread", price: "80.00" },
        ],
      },
    ],
  },
  //Tea Done
  {
    name: "Tea",
    price: "30.00",
    customizationOptions: [
      // {
      //   name: "Choice of Tea",
      //   type: "radio",
      //   options: [{ label: "Assam" }, { label: "Darjeeling" }],
      // },
      {
        name: "Appetite",
        type: "radio",
        options: [
          { label: "With Milk ", price: "50.00" },
          { label: "Black", price: "30.00" },
        ],
      },
      {
        name: "Taste",
        type: "radio",
        options: [
          { label: "Without Sugar" },
          { label: "With Sugar" },
          { label: "Salt" },
          { label: "Sugarfree Tablet" },
        ],
      },
      {
        name: "Herbs/Flavours",
        type: "checkbox",
        options: [
          { label: "Masala", price: "10.00" },
          { label: "Ginger", price: "10.00" },
          { label: "Cinnamon", price: "10.00" },
          { label: "Clove", price: "10.00" },
          { label: "Rose", price: "10.00" },
          { label: "Chocolate", price: "10.00" },
          { label: "Honey", price: "10.00" },
          { label: "Elaichi", price: "20.00" },
          { label: "Kesar", price: "30.00" },
        ],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Sugar" },
          { label: "Black Salt" },
          { label: "White Salt" },
          { label: "Black Pepper" },
          { label: "Lemon", price: "10.00" },
          { label: "Rusk Biscuit", price: "10.00" },
        ],
      },
    ],
  },
  //Coffee Done
  {
    name: "Coffee",
    price: "50.00",
    customizationOptions: [
      {
        name: "Coffee Type",
        type: "radio",
        options: [
          { label: "Hot", price: "50.00" },
          { label: "Cold", price: "160.00" },
        ],
      },
      {
        name: "Appetite",
        type: "radio",
        options: [{ label: "With Milk", price: "20.00" }, { label: "Black" }],
      },
      {
        name: "Flavour",
        type: "radio",
        options: [
          { label: "Plain" },
          { label: "Vanilla", price: "10.00" },
          { label: "Caramel", price: "10.00" },
          { label: "Cinnamon", price: "10.00" },
          { label: "Strawberry", price: "10.00" },
          { label: "Chocolate", price: "10.00" },
          { label: "Hazelnut", price: "30.00" },
        ],
      },
      {
        name: "Type",
        type: "radio",
        options: [
          { label: "Regular" },
          { label: "Cappuccino", price: "30.00" },
        ],
      },

      {
        name: "Taste",
        type: "radio",
        options: [
          { label: "Without Sugar" },
          { label: "With Sugar" },
          { label: "Salt" },
          { label: "Sugarfree Tablet" },
        ],
      },
      {
        name: "Extra",
        type: "checkbox",
        options: [
          { label: "Sugar" },
          { label: "Coffee Cream", price: "30.00" },
          { label: "Vanilla Icecream", price: "50.00" },
          { label: "Strawberry Icecream", price: "50.00" },
          { label: "Caramel Icecream", price: "50.00" },
          { label: "Chocolate Icecream", price: "50.00" },
        ],
      },
    ],
  },
  // Maggi Done
  {
    name: "Maggie",
    price: "50.00",
    customizationOptions: [
      {
        name: "Flavour",
        type: "radio",
        options: [
          { label: "Plain", price: "50.00" },
          { label: "Masala", price: "70.00" },
          { label: "Schezwan", price: "80.00" },
          { label: "Ultimate", price: "100.00" },
        ],
      },
      {
        name: "Texture",
        type: "radio",
        options: [{ label: "Soupy" }, { label: "SemiSoupy" }, { label: "Dry" }],
      },
      {
        name: "Extras/Meat",
        type: "checkbox",
        options: [
          { label: "Extra Cheese", price: "50.00" },
          { label: "Green Chilly", price: "10.00" },
          { label: "Sweetcorn", price: "10.00" },
          { label: "Onion", price: "10.00" },
          { label: "Tomato", price: "10.00" },
          { label: "Carrot", price: "20.00" },
          { label: "Capsicum", price: "40.00" },
          { label: "Mushrooms", price: "50.00" },
          { label: "Paneer", price: "50.00" },
          { label: "Poached Egg", price: "40.00" },
          { label: "Plain Omelette", price: "40.00" },
          { label: "Masala Omelette", price: "80.00" },
          { label: "Chicken", price: "50.00" },

          { label: "Sliced Chicken Sausage", price: "50.00" },
          { label: "Chicken Salami", price: "50.00" },
          { label: "Chicken Pepperoni", price: "100.00" },
          { label: "Bacon Strips", price: "130.00" },
        ],
      },
      {
        name: "Toppings",
        type: "checkbox",
        options: [
          { label: "Tamarind Chutney(Imlee)", price: "10.00" },
          { label: "Mint Coriandar Chutney", price: "10.00" },
          { label: "Green Chilli Sauce", price: "10.00" },
          { label: "Tomato Sauce", price: "10.00" },
          { label: "Momo Chutney", price: "10.00" },
          { label: "Dalle Achar", price: "20.00" },
          { label: "Mayonnaise", price: "20.00" },
          { label: "Schezwan Chutney", price: "20.00" },
          { label: "Mustard Sauce", price: "20.00" },
        ],
      },
    ],
  },

  {
    name: "Wai Wai",
    price: "50.00",
    customizationOptions: [
      {
        name: "Preference",
        type: "radio",
        options: [
          { label: "Veg", price: "50.00" },
          { label: "Chicken", price: "50.00" },
        ],
      },
      {
        name: "Flavour",
        type: "radio",
        options: [{ label: "Plain" }, { label: "Schezwan", price: "30.00" }],
      },
      {
        name: "Texture",
        type: "radio",
        options: [
          { label: "Soupy" },
          { label: "SemiSoupy" },
          { label: "Dry" },
          { label: "Chaat(NonSpicy)", price: "30.00" },
          { label: "Chaat(Spicy)", price: "30.00" },
        ],
      },
      {
        name: "Extras/Meat",
        type: "checkbox",
        options: [
          { label: "Extra Cheese", price: "50.00" },
          { label: "Green Chilly", price: "10.00" },
          { label: "Sweetcorn", price: "10.00" },
          { label: "Onion", price: "10.00" },
          { label: "Tomato", price: "10.00" },
          { label: "Carrot", price: "20.00" },
          { label: "Paneer", price: "50.00" },
          { label: "Poached Egg", price: "40.00" },
          { label: "Plain Omelette", price: "40.00" },
          { label: "Masala Omelette", price: "80.00" },
          { label: "Chicken", price: "50.00" },
          { label: "Sliced Chicken Sausage", price: "50.00" },
          { label: "Chicken Salami", price: "50.00" },
          { label: "Chicken Pepperoni", price: "100.00" },
          { label: "Bacon Strips", price: "100.00" },
        ],
      },
      {
        name: "Toppings",
        type: "checkbox",
        options: [
          { label: "Tamarind Chutney(Imlee)", price: "10.00" },
          { label: "Mint Coriandar Chutney", price: "10.00" },
          { label: "Green Chilli Sauce", price: "10.00" },
          { label: "Tomato Sauce", price: "10.00" },
          { label: "Momo Chutney", price: "10.00" },
          { label: "Dalle Achar", price: "20.00" },
          { label: "Mayonnaise", price: "20.00" },
          { label: "Schezwan Chutney", price: "20.00" },
          { label: "Mustard Sauce", price: "20.00" },
        ],
      },
    ],
  },

  //Ramen Done
  {
    name: "Ramen",
    price: "250.00",
    customizationOptions: [
      {
        name: "Flavour",
        type: "radio",
        options: [
          { label: "2X Spicy(NonVeg)", price: "250.00" },
          { label: "Yellow Cheese(NonVeg)", price: "250.00" },
          { label: "Pink Cheese(NonVeg)", price: "250.00" },
          { label: "Quattro Cheese(NonVeg)", price: "250.00" },
          { label: "Black(NonVeg)", price: "250.00" },
          { label: "ShinRamen SuperSpicy(Veg)", price: "250.00" },
          { label: "Veg Kimchi Spicy", price: "250.00" },
          { label: "Authentic Kimchi NonSpicy(Veg)", price: "250.00" },
          { label: "Beans Sprouts Kimchi(Veg)", price: "250.00" },
        ],
      },
      {
        name: "Texture",
        type: "radio",
        options: [{ label: "Soupy" }, { label: "SemiSoupy" }, { label: "Dry" }],
      },
      {
        name: "Extras/Meat",
        type: "checkbox",
        options: [
          { label: "Extra Cheese", price: "50.00" },
          { label: "Green Chilly", price: "10.00" },
          { label: "Sweetcorn", price: "10.00" },
          { label: "Onion", price: "10.00" },
          { label: "Tomato", price: "10.00" },
          { label: "Carrot", price: "20.00" },
          { label: "Capsicum", price: "40.00" },

          { label: "Mushrooms", price: "50.00" },
          { label: "Paneer", price: "50.00" },
          { label: "Poached Egg", price: "40.00" },
          { label: "Plain Omelette", price: "40.00" },
          { label: "Chicken", price: "50.00" },

          { label: "Masala Omelette", price: "80.00" },
          { label: "Sliced Chicken Sausage", price: "50.00" },
          { label: "Chicken Salami", price: "50.00" },
          { label: "Chicken Pepperoni", price: "100.00" },
          { label: "Bacon Strips", price: "100.00" },
        ],
      },
      {
        name: "Toppings",
        type: "checkbox",
        options: [
          { label: "Tamarind Chutney(Imlee)", price: "10.00" },
          { label: "Mint Coriandar Chutney", price: "10.00" },
          { label: "Green Chilli Sauce", price: "10.00" },
          { label: "Tomato Sauce", price: "10.00" },
          { label: "Mayonnaise", price: "20.00" },
          { label: "Schezwan Chutney", price: "20.00" },
          { label: "Mustard Sauce", price: "20.00" },
        ],
      },
    ],
  },
  //Soup DOne
  {
    name: "Soup",
    price: "70.00",
    customizationOptions: [
      {
        name: "Select Broth",
        type: "radio",
        options: [
          { label: "Sweetcorn Soup", price: "70.00" },
          { label: "Hot & Sour Soup", price: "70.00" },
        ],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Black Pepper" },
          { label: "Black Salt" },
          { label: "PeriPeri Seasoning", price: "20.00" },
          { label: "Chat Masala", price: "10.00" },
          { label: "Soya Sauce", price: "10.00" },
          { label: "Ginger", price: "10.00" },
          { label: "Garlic", price: "10.00" },
          { label: "Green Chilli", price: "10.00" },
          { label: "Dalle Achar", price: "20.00" },
          { label: "Lemon", price: "20.00" },
          { label: "Infused Egg", price: "20.00" },
          { label: "Chicken", price: "50.00" },

          { label: "Mushrooms", price: "50.00" },
          { label: "Sliced Chicken Sausages", price: "50.00" },
          { label: "Chicken Pepperoni", price: "100.00" },
        ],
      },
    ],
  },
  //Momo Done
  {
    name: "Momo",

    price: "100.00",

    customizationOptions: [
      {
        name: "Preference",

        type: "radio",

        options: [
          { label: "Veg", price: "100.00" },

          { label: "Chicken ", price: "130.00" },
          { label: "Chicken & Corainder ", price: "130.00" },
        ],
      },

      {
        name: "Texture",

        type: "radio",

        options: [{ label: "Steamed" }, { label: "Fried", price: "20.00" }],
      },

      {
        name: "Flavour",

        type: "radio",

        options: [
          { label: "Plain" },

          { label: "PeriPeri", price: "20.00" },

          { label: "Jhol Momo", price: "50.00" },

          { label: "Schezwan Saute", price: "70.00" },

          { label: "Honey Chilli Saute", price: "70.00" },
        ],
      },

      {
        name: "Toppings",

        type: "checkbox",

        options: [
          { label: "Momo Soup" },

          { label: "Tomato Sauce", price: "10.00" },

          { label: "Green Chilli Sauce", price: "10.00" },

          { label: "Tamarind Chutney (Imlee)", price: "10.00" },

          { label: "Mint Coriandar Chutney", price: "10.00" },

          { label: "Momo Chutney", price: "10.00" },

          { label: "Dalle Achar", price: "20.00" },

          { label: "Schezwan Chutney", price: "20.00" },

          { label: "Mayonnaise", price: "20.00" },

          { label: "Mustard Sauce", price: "20.00" },

          { label: "Chat Masala", price: "20.00" },
        ],
      },
    ],
  },

  //Snackd DOne
  {
    name: "Snacks",

    price: "80.00",
    // description: "dry/saucy",

    customizationOptions: [
      {
        name: "Select Snack",

        type: "radio",

        options: [
          { label: "Veg Cutlet (2PCS)", price: "80.00" },

          { label: "Chicken Cutlet (2PCS)", price: "100.00" },

          { label: "French Fry", price: "100.00" },

          { label: "Potato Cheese Shots", price: "100.00" },

          { label: "Cheese Corn Nuggets", price: "170.00" },
          { label: "Paneer Pakora", price: "180.00" },

          { label: "Chicken Pakora", price: "180.00" },

          { label: "Chicken Nuggets", price: "220.00" },

          { label: "Grilled Chicken Sausages", price: "220.00" },

          { label: "Chicken Wings", price: "250.00" },

          { label: "Grilled Bacon", price: "280.00" },
        ],
      },

      {
        name: "Flavour",

        type: "checkbox",

        options: [
          { label: "Classic Salted" },

          { label: "Salt & Pepper" },

          { label: "GingerGarlic", price: "20.00" },

          { label: "PeriPeri", price: "20.00" },

          { label: "Saute In Schezwan Sauce", price: "70.00" },

          { label: "Saute In Honey Chilli Sauce", price: "70.00" },
        ],
      },

      {
        name: "Toppings",

        type: "checkbox",

        options: [
          { label: "Tamarind Chutney (Imlee)", price: "10.00" },

          { label: "Mint Coriandar Chutney", price: "10.00" },

          { label: "Green Chilli Sauce", price: "10.00" },

          { label: "Tomato Sauce", price: "10.00" },

          { label: "Momo Chutney", price: "10.00" },

          { label: "Dalle Achar", price: "20.00" },

          { label: "Mayonnaise", price: "20.00" },

          { label: "Schezwan Chutney", price: "20.00" },

          { label: "Mustard Sauce", price: "20.00" },
        ],
      },
    ],
  },
  //Rice Done
  {
    name: "Rice Bowl",

    price: "50.00",

    customizationOptions: [
      {
        name: "Select Rice",

        type: "radio",

        options: [
          { label: "Steamed Rice", price: "50.00" },

          { label: "Veg Pulao", price: "150.00" },

          { label: "Veg Fried Rice", price: "150.00" },

          { label: "Egg Fried Rice", price: "180.00" },

          { label: "Chicken Fried Rice", price: "200.00" },
        ],
      },

      {
        name: "Extras/Meat",

        type: "checkbox",

        options: [
          { label: "Raw Onions", price: "20.00" },

          { label: "Ghee", price: "50.00" },

          { label: "Mushroom", price: "50.00" },

          { label: "Paneer", price: "50.00" },

          { label: "Brocolli", price: "50.00" },

          { label: "Poached Egg", price: "40.00" },

          { label: "Plain Omelette", price: "40.00" },

          { label: "Masala Omelette", price: "80.00" },

          { label: "Sliced Chicken Sausage", price: "50.00" },

          { label: "Chicken Bacon Strips", price: "130.00" },
        ],
      },

      {
        name: "Toppings",

        type: "checkbox",

        options: [
          { label: "Chat Masala", price: "10.00" },

          { label: "Tomato Sauce", price: "10.00" },

          { label: "Green Chilli Sauce", price: "10.00" },

          { label: "Tamarind Chutney (Imlee)", price: "10.00" },

          { label: "Mint Coriandar Chutney", price: "10.00" },

          { label: "Momo Chutney", price: "10.00" },

          { label: "Dalle Achar", price: "20.00" },

          { label: "Mayonnaise", price: "20.00" },

          { label: "Schezwan Chutney", price: "20.00" },

          { label: "Mustard Sauce", price: "20.00" },
        ],
      },
    ],
  },

  //Indian Gracy DOne
  // {
  //   name: "Indian Gravy",
  //   soldOut: true,
  //   price: "70.00",

  //   customizationOptions: [
  //     {
  //       name: "Select Your Meal",

  //       type: "radio",

  //       options: [
  //         { label: "Yellow Dal Tadka", price: "70.00" },

  //         { label: "Dal Makhani", price: "100.00" },

  //         { label: "Rajma Masala", price: "150.00" },

  //         { label: "Paneer Butter Masala", price: "200.00" },

  //         { label: "Butter Chicken", price: "200.00" },
  //       ],
  //     },
  //   ],
  // },

  //Pasta Done
  {
    name: "Pasta",
    price: "200.00",
    customizationOptions: [
      {
        name: "Flavour",
        type: "radio",
        options: [
          { label: "White Sauce", price: "200.00" },
          { label: "Red Sauce", price: "200.00" },
          { label: "Masala Penne", price: "200.00" },
        ],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Cheese", price: "50.00" },
          { label: "Mushrooms", price: "50.00" },
          { label: "Paneer", price: "50.00" },
          { label: "Sliced Chicken Sausage", price: "50.00" },
          { label: "Chicken Pepperoni", price: "100.00" },
          { label: "Bacon Strips", price: "130.00" },
        ],
      },
    ],
  },
  //Sandwich Done
  {
    name: "Sandwich",
    price: "250.00",
    customizationOptions: [
      {
        name: "Flavour of Bread",
        type: "radio",
        options: [
          { label: "Plain", price: "250.00" },
          { label: "GingerGarlic", price: "270.00" },
          { label: "PeriPeri", price: "280.00" },
          { label: "Schezwan", price: "300.00" },
        ],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Mushrooms", price: "50.00" },
          { label: "Paneer", price: "50.00" },
          { label: "Poached Egg", price: "40.00" },
          { label: "Chicken", price: "50.00" },
          { label: "Sliced Chicken Sausage", price: "50.00" },
          { label: "Chicken Salami", price: "50.00" },
          { label: "Chicken Pepperoni", price: "100.00" },
          { label: "Bacon Strips", price: "130.00" },
          { label: "Chicken Tikka", price: "150.00" },
        ],
      },
    ],
  },
  //Burger
  {
    name: "Burger",
    price: "250.00",
    customizationOptions: [
      {
        name: "Select Burger",
        type: "radio",
        options: [
          { label: "Veg Cheese Burger", price: "250.00" },
          { label: "Chicken Cheese Burger", price: "300.00" },
        ],
      },
      {
        name: "Flavour Of Bun",
        type: "radio",
        options: [
          { label: "Plain", price: "" },
          { label: "GingerGarlic", price: "20.00" },
          { label: "PeriPeri", price: "30.00" },
          { label: "Schezwan", price: "50.00" },
        ],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Mushrooms", price: "50.00" },
          { label: "Paneer", price: "50.00" },
          { label: "Poached Egg", price: "40.00" },
          { label: "Sliced Chicken Sausage", price: "50.00" },
          { label: "Chicken Salami", price: "50.00" },
          { label: "Chicken Pepperoni", price: "100.00" },
          { label: "Chicken", price: "50.00" },

          { label: "Bacon Strips", price: "130.00" },
          { label: "Chicken Tikka", price: "150.00" },
        ],
      },
    ],
    //Pizza
  },
  //Pizza Done
  {
    name: "Pan Pizza",
    price: "350.00",
    soldOut: false,

    customizationOptions: [
      {
        name: "Flavour",
        type: "radio",
        options: [
          { label: "Margherita", price: "350.00" },
          { label: "Paneer & Mushroom", price: "400.00" },
          { label: "Chicken & Sausage", price: "450.00" },
          { label: "Chicken Pepperoni", price: "500.00" },
        ],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Mushrooms", price: "50.00" },
          { label: "Paneer", price: "50.00" },
          { label: "Sliced Chicken Sausage", price: "50.00" },
          { label: "Tandoori Tikkas", price: "100.00" },
          { label: "Chicken Pepperoni", price: "100.00" },
          { label: "Bacon Strips", price: "130.00" },
        ],
      },
    ],
  },
  //Misc
  {
    name: "Others",
    price: "0",
    customizationOptions: [
      {
        name: "Cigarette",
        type: "checkbox",
        options: [
          { label: "Lighter", price: "20.00" },
          { label: "Shikhar", price: "20.00" },
          { label: "Indiemint", price: "20.00" },
          { label: "Gold Flake Premium", price: "20.00" },
          { label: "Gold Flake Lite", price: "30.00" },
          { label: "Classic Mild", price: "30.00" },
        ],
      },
      {
        name: "Dessert",
        type: "checkbox",
        options: [
          { label: "Chocopie", price: "30.00" },
          { label: "Coffee Cream", price: "30.00" },
          { label: "Vanilla Icecream", price: "50.00" },
          { label: "Strawberry Icecream", price: "50.00" },
          { label: "Chocolate Icecream", price: "50.00" },
          // { label: "Biscoff Cheesecake", price: "150.00" },
          { label: "Hot Choco Brownie", price: "150.00" },
          { label: "Chocolava Cake", price: "150.00" },
        ],
      },
      {
        name: "Meat",
        type: "checkbox",
        options: [
          { label: "Boiled Eggs (2PCS)", price: "40.00" },
          { label: "Poached Egg", price: "40.00" },
          { label: "Plain Omelette", price: "40.00" },
          { label: "Masala Omelette", price: "80.00" },
          { label: "Fried Paneer", price: "50.00" },
          { label: "Lemon", price: "20.00" },
          { label: "Sliced Cucumber", price: "20.00" },
          { label: "Rusk", price: "10.00" },
          { label: "Momo Soup (Veg)", price: "10.00" },
          { label: "Momo Soup (Chicken)", price: "10.00" },
        ],
      },
      {
        name: "Extras",
        type: "checkbox",
        options: [
          { label: "Tomato Sauce", price: "10.00" },
          { label: "Green Chilli Sauce", price: "10.00" },
          { label: "Tamarind Chutney (Imlee)", price: "10.00" },
          { label: "Mint Coriandar Chutney", price: "10.00" },
          { label: "Momo Chutney", price: "10.00" },
          { label: "Dalle Achar", price: "20.00" },
          { label: "Schezwan Chutney", price: "20.00" },
          { label: "Mayonnaise", price: "20.00" },
          { label: "Mustard Sauce", price: "20.00" },
          { label: "Chat Masala", price: "20.00" },
        ],
      },
    ],
  },
];
