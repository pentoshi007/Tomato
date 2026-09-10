type DemoMenuItemSeed = {
  name: string;
  description: string;
  price: number;
  image: string;
};

type DemoRestaurantSeed = {
  name: string;
  description: string;
  phone: number;
  image: string;
  distanceKm: number;
  bearingDeg: number;
  addressLine: string;
  menu: DemoMenuItemSeed[];
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=60`;

const commons = (path: string) =>
  `https://upload.wikimedia.org/wikipedia/commons/${path}`;

const mealdb = (id: string) => `https://www.themealdb.com/images/media/meals/${id}.jpg`;

export const DEMO_RESTAURANT_CATALOG: DemoRestaurantSeed[] = [
  {
    name: "Spice Junction",
    description:
      "Slow-cooked North Indian classics from a tandoor-fired kitchen — rich gravies, smoky kebabs and hot breads.",
    phone: 9810012401,
    image: unsplash("1555939594-58d7cb561ad1"),
    distanceKm: 1.8,
    bearingDeg: 40,
    addressLine: "14, Dilli Haat Market",
    menu: [
      {
        name: "Butter Chicken",
        description:
          "Tandoori chicken simmered in a silky tomato-butter gravy with cream and kasuri methi.",
        price: 320,
        image: commons("thumb/3/3c/Chicken_makhani.jpg/960px-Chicken_makhani.jpg"),
      },
      {
        name: "Chicken Curry",
        description:
          "Home-style chicken curry with caramelised onions, ginger and a grounded whole-spice masala.",
        price: 280,
        image: mealdb("yxsurp1511304301"),
      },
      {
        name: "Lamb Rogan Josh",
        description:
          "Kashmiri lamb braised low and slow with fennel, dry ginger and a deep red chilli base.",
        price: 360,
        image: mealdb("vvstvq1487342592"),
      },
      {
        name: "Dal Fry",
        description:
          "Yellow lentils tempered with cumin, garlic and tomato, finished with a desi-ghee tadka.",
        price: 160,
        image: mealdb("wuxrtu1483564410"),
      },
      {
        name: "Matar Paneer",
        description:
          "Cottage cheese and green peas in a tomato-cashew gravy with a touch of honey.",
        price: 240,
        image: mealdb("xxpqsy1511452222"),
      },
      {
        name: "Tandoori Chicken",
        description:
          "Half chicken marinated overnight in hung curd and spices, charred in the clay oven.",
        price: 290,
        image: mealdb("qptpvt1487339892"),
      },
      {
        name: "Masala Chai",
        description:
          "Assam tea brewed with crushed ginger, cardamom and a whisper of clove.",
        price: 60,
        image: commons("thumb/6/6a/Masala_Chai.jpg/960px-Masala_Chai.jpg"),
      },
    ],
  },
  {
    name: "Dragon Wok",
    description:
      "Wok-tossed Chinese street food — blazing heat, glossy sauces and hand-pulled noodles.",
    phone: 9810012402,
    image: unsplash("1526318896980-cf78c088247c"),
    distanceKm: 1.4,
    bearingDeg: 150,
    addressLine: "7, Lantern Street",
    menu: [
      {
        name: "Kung Pao Chicken",
        description:
          "Diced chicken tossed with roasted peanuts, dried chillies and Sichuan peppercorn.",
        price: 260,
        image: mealdb("1525872624"),
      },
      {
        name: "General Tso's Chicken",
        description:
          "Crisp chicken glazed in a sweet-tangy chilli sauce with sesame and spring onion.",
        price: 280,
        image: mealdb("1529444113"),
      },
      {
        name: "Lo Mein Noodles",
        description:
          "Egg noodles stir-fried with shredded vegetables and a dark soy-garlic sauce.",
        price: 220,
        image: mealdb("1529444830"),
      },
      {
        name: "Ma Po Tofu",
        description:
          "Silken tofu in a fiery bean-paste sauce with numbing Sichuan pepper.",
        price: 210,
        image: mealdb("1525874812"),
      },
      {
        name: "Hot and Sour Soup",
        description:
          "Peppery, vinegar-laced broth with mushrooms, tofu ribbons and egg swirl.",
        price: 130,
        image: mealdb("1529445893"),
      },
      {
        name: "Egg Drop Soup",
        description:
          "Comforting clear soup with silky ribbons of beaten egg and scallions.",
        price: 120,
        image: mealdb("1529446137"),
      },
      {
        name: "Chicken Fried Rice",
        description:
          "Wok-charred rice with shredded chicken, egg and peas in a light soy glaze.",
        price: 190,
        image: mealdb("wuyd2h1765655837"),
      },
      {
        name: "Beef and Broccoli",
        description:
          "Velveted beef strips with crisp broccoli in a glossy oyster-ginger sauce.",
        price: 270,
        image: mealdb("m0p0j81765568742"),
      },
    ],
  },
  {
    name: "Dosa Corner",
    description:
      "Crisp South Indian dosas, steamed idlis and filter coffee from a courtyard kitchen.",
    phone: 9810012403,
    image: commons("thumb/5/50/Dosa_01.jpg/960px-Dosa_01.jpg"),
    distanceKm: 2.6,
    bearingDeg: 95,
    addressLine: "3, Jasmine Lane",
    menu: [
      {
        name: "Masala Dosa",
        description:
          "Golden rice-batter dosa with spiced potato filling, coconut chutney and sambar.",
        price: 120,
        image: commons(
          "thumb/b/b1/Dosa-chutney-sambhar.jpg/960px-Dosa-chutney-sambhar.jpg",
        ),
      },
      {
        name: "Ghee Roast Dosa",
        description:
          "Paper-thin dosa roasted in pure ghee until shatter-crisp, served with chutneys.",
        price: 110,
        image: commons(
          "thumb/7/73/Dosa_with_Lemon_pickle.jpg/960px-Dosa_with_Lemon_pickle.jpg",
        ),
      },
      {
        name: "Idli Sambar",
        description:
          "Three steamed idlis with hot sambar and fresh coconut-mint chutney.",
        price: 80,
        image: commons("1/11/Idli_Sambar.JPG"),
      },
      {
        name: "Medu Vada",
        description:
          "Four crisp-on-the-outside, fluffy-on-the-inside lentil doughnuts with chutney.",
        price: 90,
        image: commons(
          "thumb/c/c9/Aesthetic_Medu_Vadai.jpg/960px-Aesthetic_Medu_Vadai.jpg",
        ),
      },
      {
        name: "Samosa (2 pc)",
        description:
          "Flaky pastry triangles stuffed with spiced potato and peas, tamarind chutney.",
        price: 70,
        image: commons("thumb/e/ed/Samosa_4.jpg/960px-Samosa_4.jpg"),
      },
      {
        name: "Filter Coffee",
        description:
          "Strong South Indian decoction coffee, frothed in a steel dabarah tumbler.",
        price: 50,
        image: commons("8/84/Indian_filter_coffee_in_Dabarah.jpg"),
      },
    ],
  },
  {
    name: "Sweet Tooth Café",
    description:
      "A dessert-first café plating cakes, tarts and bakes straight from the oven.",
    phone: 9810012404,
    image: unsplash("1565958011703-44f9829ba187"),
    distanceKm: 3.0,
    bearingDeg: 70,
    addressLine: "21, Rosewood Avenue",
    menu: [
      {
        name: "Apple Pie",
        description:
          "Bramley apples baked with cinnamon under a buttery lattice crust.",
        price: 140,
        image: mealdb("stnxzp1784835840"),
      },
      {
        name: "Carrot Cake",
        description:
          "Spiced carrot sponge with cream-cheese frosting and toasted walnuts.",
        price: 150,
        image: mealdb("vrspxv1511722107"),
      },
      {
        name: "Bakewell Tart",
        description:
          "Shortcrust shell with raspberry jam and frangipane, dusted with icing sugar.",
        price: 130,
        image: mealdb("wyrqqq1468233628"),
      },
      {
        name: "Blackberry Fool",
        description:
          "Folded blackberry purée and whipped cream, chilled and glass-served.",
        price: 120,
        image: mealdb("rpvptu1511641092"),
      },
      {
        name: "Battenberg Cake",
        description:
          "Checkered almond-and-pink sponge wrapped in golden marzipan.",
        price: 150,
        image: mealdb("ywwrsp1511720277"),
      },
      {
        name: "Apple Frangipan Tart",
        description:
          "Almond cream tart topped with fanned apple slices and apricot glaze.",
        price: 160,
        image: mealdb("wxywrq1468235067"),
      },
      {
        name: "Alfajores",
        description:
          "Buttery shortbread cookies hugging dulce de leche, rolled in coconut.",
        price: 110,
        image: mealdb("a4kgf21763075288"),
      },
      {
        name: "Buttermilk Pancakes",
        description:
          "A stack of fluffy pancakes with maple syrup and a butter pat.",
        price: 130,
        image: unsplash("1567620905732-2d1ec7ab7445"),
      },
    ],
  },
  {
    name: "Bella Napoli",
    description:
      "Wood-fired Italian — blistered Neapolitan pizza and pasta rolled fresh every morning.",
    phone: 9810012405,
    image: unsplash("1565299624946-b28f40a0ae38"),
    distanceKm: 3.4,
    bearingDeg: 200,
    addressLine: "9, Piazza Road",
    menu: [
      {
        name: "Margherita Pizza",
        description:
          "San Marzano tomato, fior di latte and basil on a 48-hour fermented crust.",
        price: 240,
        image: mealdb("x0lk931587671540"),
      },
      {
        name: "Spaghetti Bolognese",
        description:
          "Slow-reduced beef ragù folded through spaghetti with parmigiano.",
        price: 280,
        image: mealdb("sutysw1468247559"),
      },
      {
        name: "Spaghetti Carbonara",
        description:
          "Egg yolk, pecorino, guanciale and cracked pepper — no cream, ever.",
        price: 260,
        image: mealdb("llcbn01574260722"),
      },
      {
        name: "Fettuccine Alfredo",
        description:
          "Fresh fettuccine emulsified with butter and parmigiano reggiano.",
        price: 250,
        image: mealdb("0jv5gx1661040802"),
      },
      {
        name: "Lasagne",
        description:
          "Layered pasta sheets, ragù and béchamel baked with a golden crust.",
        price: 290,
        image: mealdb("wtsvxx1511296896"),
      },
      {
        name: "Chilli Prawn Linguine",
        description:
          "Sautéed prawns with garlic, chilli flakes, lemon and flat-leaf parsley.",
        price: 320,
        image: mealdb("usywpp1511189717"),
      },
      {
        name: "Salmon Prawn Risotto",
        description:
          "Carnaroli rice stirred to a wave with salmon, prawns and dill butter.",
        price: 340,
        image: mealdb("xxrxux1503070723"),
      },
    ],
  },
  {
    name: "Bangkok Street",
    description:
      "Thai street favourites — pounding pestles, wok smoke and balance of sweet, sour and heat.",
    phone: 9810012406,
    image: unsplash("1544025162-d76694265947"),
    distanceKm: 4.1,
    bearingDeg: 290,
    addressLine: "5, Orchid Alley",
    menu: [
      {
        name: "Pad Thai",
        description:
          "Rice noodles tossed with egg, bean sprouts, crushed peanuts and lime.",
        price: 220,
        image: mealdb("rg9ze01763479093"),
      },
      {
        name: "Pad See Ew",
        description:
          "Wide noodles in dark soy with Chinese broccoli and a crisp fried egg.",
        price: 210,
        image: mealdb("uuuspp1468263334"),
      },
      {
        name: "Massaman Curry",
        description:
          "Fragrant coconut curry with tender beef, roasted peanuts and potatoes.",
        price: 260,
        image: mealdb("tvttqv1504640475"),
      },
      {
        name: "Panang Chicken Curry",
        description:
          "Thicker, nuttier red curry with sliced chicken, lime leaves and basil.",
        price: 240,
        image: mealdb("0dhtwr1763371444"),
      },
      {
        name: "Drunken Noodles",
        description:
          "Pad kee mao with holy basil, bird's eye chillies and a smoky wok char.",
        price: 200,
        image: mealdb("2wx8cm1763373419"),
      },
      {
        name: "Thai Fried Rice",
        description:
          "Jasmine rice with prawns and peas, lifted with fish sauce and lime.",
        price: 190,
        image: mealdb("hblwvg1763478203"),
      },
      {
        name: "Red Curry Chicken Skewers",
        description:
          "Grilled chicken skewers basted in red curry paste with sweet chilli dip.",
        price: 230,
        image: mealdb("prjve31763486864"),
      },
    ],
  },
  {
    name: "Taco Verde",
    description:
      "Bright Mexican plates — charred tortillas, slow-braised meats and fresh salsa cruda.",
    phone: 9810012407,
    image: unsplash("1551504734-5ee1c4a1479b"),
    distanceKm: 5.2,
    bearingDeg: 245,
    addressLine: "2, Cactus Court",
    menu: [
      {
        name: "Fish Tacos",
        description:
          "Cajun-spiced fish in soft tortillas with shredded cabbage and lime crema.",
        price: 260,
        image: mealdb("uvuyxu1503067369"),
      },
      {
        name: "Chicken Enchiladas",
        description:
          "Rolled tortillas in smoky salsa roja, baked with melted cheese.",
        price: 240,
        image: mealdb("qtuwxu1468233098"),
      },
      {
        name: "Chickpea Fajitas",
        description:
          "Sizzling spiced chickpeas with peppers, onions and warm tortillas.",
        price: 220,
        image: mealdb("tvtxpq1511464705"),
      },
      {
        name: "Chilli Con Carne",
        description:
          "Braised beef chilli with kidney beans, cumin and a cornbread crumb.",
        price: 250,
        image: mealdb("uuqvwu1504629254"),
      },
      {
        name: "Stuffed Bell Peppers",
        description:
          "Roasted peppers filled with quinoa, black beans and Monterey Jack.",
        price: 210,
        image: mealdb("b66myb1683207208"),
      },
    ],
  },
  {
    name: "The Burger Barn",
    description:
      "Smash burgers on brioche, hand-cut fries and thick shakes from a barn-door kitchen.",
    phone: 9810012408,
    image: unsplash("1568901346375-23c9450c58cd"),
    distanceKm: 6.1,
    bearingDeg: 20,
    addressLine: "31, Haybarn Road",
    menu: [
      {
        name: "Cheeseburger Deluxe",
        description:
          "Grilled beef patty with cheddar, pickles, onion and barn sauce on brioche.",
        price: 180,
        image: commons("thumb/4/4d/Cheeseburger.jpg/960px-Cheeseburger.jpg"),
      },
      {
        name: "Classic Hamburger",
        description:
          "Naked smash patty with mustard, ketchup and crunch lettuce.",
        price: 160,
        image: commons(
          "thumb/6/62/NCI_Visuals_Food_Hamburger.jpg/960px-NCI_Visuals_Food_Hamburger.jpg",
        ),
      },
      {
        name: "Crispy French Fries",
        description:
          "Twice-fried potato batons dusted with house seasoning.",
        price: 90,
        image: commons(
          "thumb/8/8e/Truffle_oil_french_fries_%2833024792848%29.jpg/960px-Truffle_oil_french_fries_%2833024792848%29.jpg",
        ),
      },
      {
        name: "Loaded Chilli Fries",
        description:
          "Fries buried under cheddar sauce, jalapeños and spring onions.",
        price: 110,
        image: commons(
          "thumb/9/95/Plate_of_chips_at_the_Chalet_Cafe%2C_Cowfold%2C_West_Sussex%2C_England.jpg/960px-Plate_of_chips_at_the_Chalet_Cafe%2C_Cowfold%2C_West_Sussex%2C_England.jpg",
        ),
      },
      {
        name: "Chocolate Milkshake",
        description:
          "Hand-spun shake with chocolate gelato and whipped cream.",
        price: 120,
        image: commons("a/a5/Milkshake_3.jpg"),
      },
      {
        name: "Classic Hot Dog",
        description:
          "Grilled dog in a brioche roll with mustard, relish and crispy shallots.",
        price: 140,
        image: commons(
          "thumb/d/d7/My_hot_dog_at_Hot_Doug%27s.jpg/960px-My_hot_dog_at_Hot_Doug%27s.jpg",
        ),
      },
    ],
  },
  {
    name: "Biryani House",
    description:
      "Dum-style biryani sealed with dough, opened at your table — plus kebabs and breads.",
    phone: 9810012409,
    image: unsplash("1631452180519-c014fe946bc7"),
    distanceKm: 2.2,
    bearingDeg: 330,
    addressLine: "11, Saffron Lane",
    menu: [
      {
        name: "Chicken Biryani",
        description:
          "Long-grain basmati layered with marinated chicken, saffron and fried onions.",
        price: 280,
        image: commons(
          "thumb/5/5b/Chicken_biriyani-_My_cafe_restaurant_-_Meghalaya_DSC_009.jpg/960px-Chicken_biriyani-_My_cafe_restaurant_-_Meghalaya_DSC_009.jpg",
        ),
      },
      {
        name: "Lamb Biryani",
        description:
          "Slow-cooked lamb shoulder biryani with rose water and mint raita.",
        price: 340,
        image: mealdb("xrttsx1487339558"),
      },
      {
        name: "Chole Bhature",
        description:
          "Punjabi chickpea curry with two pillowy fried bhature and pickled onion.",
        price: 180,
        image: commons("thumb/7/7c/Chole_Bhature_6.jpg/960px-Chole_Bhature_6.jpg"),
      },
      {
        name: "Paneer Tikka",
        description:
          "Char-grilled cottage cheese cubes marinated in spiced yogurt.",
        price: 240,
        image: commons(
          "thumb/f/f9/Panir_Tikka_Indian_cheese_grilled.jpg/960px-Panir_Tikka_Indian_cheese_grilled.jpg",
        ),
      },
      {
        name: "Bengali Chicken Curry",
        description:
          "Mustard-oil chicken curry with potato, slow-simmered Bengali style.",
        price: 260,
        image: mealdb("9ya6o71780262651"),
      },
      {
        name: "Masala Fish Fry",
        description:
          "Coastal fish fillets rubbed with recheado masala and pan-seared.",
        price: 300,
        image: mealdb("uwxusv1487344500"),
      },
    ],
  },
];
