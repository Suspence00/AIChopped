import { Chef, Dish, ChefProvider } from './types';

export const demoChefs: Chef[] = [
  {
    "id": "anthropic",
    "name": "Sophia Castillo",
    "modelId": "anthropic/claude-3-haiku",
    "color": "bg-orange-600",
    "bio": "A passionate home cook from a vibrant multicultural family, Sophia brings a global flair to her cooking with bold flavors and family recipes.",
    "avatarUrl": "/demo/chef-anthropic.png",
    "imageModelId": "google/gemini-2.5-flash-image"
  },
  {
    "id": "google",
    "name": "Chef Maya Rodriguez",
    "modelId": "google/gemini-2.5-flash-lite",
    "color": "bg-blue-600",
    "bio": "From her family's bustling taco truck, Maya brings generations of flavor to the competition!",
    "avatarUrl": "/demo/chef-google.png",
    "imageModelId": "google/gemini-2.5-flash-image"
  },
  {
    "id": "openai",
    "name": "Rowan Kline",
    "modelId": "openai/gpt-4.1-nano",
    "color": "bg-green-600",
    "bio": "A former bakery intern turned TV pantry host, Rowan Kline crafts bold flavors with street-smart hustle and a fearless, sunny kitchen swagger.",
    "avatarUrl": "/demo/chef-openai.png",
    "imageModelId": "google/gemini-2.5-flash-image"
  },
  {
    "id": "xai",
    "name": "Lena Vasquez",
    "modelId": "xai/grok-4.1-fast-reasoning",
    "color": "bg-gray-600",
    "bio": "Ex-line cook channeling abuela's Mexican flavors into bold fusion dishes on the home front.",
    "avatarUrl": "/demo/chef-xai.png",
    "imageModelId": "google/gemini-2.5-flash-image"
  }
];

export const demoBaskets: string[][] = [
  [
    "Fruit and Nut Bars",
    "Turkey Giblets",
    "Potato Latkes",
    "Kosher Shrimp"
  ],
  [
    "Sourdough Bread",
    "Pork Tenderloin",
    "Pickled Radish",
    "Blackberries"
  ],
  [
    "Coconut Milk",
    "Dark Chocolate",
    "Blood Orange",
    "Pistachios"
  ]
];

export const demoDishes: Record<ChefProvider, Dish[]> = {
  "anthropic": [
    {
      "roundNumber": 1,
      "chefId": "anthropic",
      "title": "Seared Shrimp Latke Bites with Fruit & Nut Giblet Tapenade",
      "description": "Today for you judges, I have made Seared Shrimp Latke Bites with Fruit & Nut Giblet Tapenade. I wanted to create an appetizer that would awaken the senses with bold, contrasting flavors and textures.\n\nTo start, I took the potato latkes and seared them to create a crispy base. I then topped each one with a succulent piece of kosher shrimp, seared to perfection.\n\nFor the tapenade, I blended the turkey giblets with the fruit and nut bars, creating a savory-sweet spread that complements the richness of the shrimp and the crunch of the latke. I added a touch of lemon juice and fresh herbs to brighten the flavors.\n\nThe result is a sophisticated, balanced bite that hits all the right notes—salty, sweet, rich, and bright. I wanted to showcase Sophia's global culinary influences in a way that is both visually appealing and delightfully flavorful.",
      "ingredientsUsed": [
        "Fruit and Nut Bars",
        "Turkey Giblets",
        "Potato Latkes",
        "Kosher Shrimp"
      ],
      "imageUrl": "/demo/dish-anthropic-r1.png",
      "shortImagePrompt": "Three crispy potato latke bites topped with seared shrimp, with a vibrant green tapenade and fresh herbs on a small plate, professional food photography"
    },
    {
      "roundNumber": 2,
      "chefId": "anthropic",
      "title": "Pork Tenderloin Medallions with Blackberry-Radish Relish and Sourdough Crostini",
      "description": "Today for you judges, I have made Pork Tenderloin Medallions with Blackberry-Radish Relish and Sourdough Crostini. I wanted to showcase the vibrant flavors and textures of these wonderful ingredients in a balanced and harmonious entree.\n\nI seared the pork tenderloin to a beautiful golden-brown crust, then sliced it into tender medallions. The rich pork is complemented by a bright and tangy blackberry-radish relish: I quickly pickled the radish slices for crunch and acidity, folded in fresh blackberries, herbs, and a touch of honey to balance the flavors.\n\nFor the sourdough, I toasted thick slices into rustic crostini to soak up the flavorful relish. The tangy, chewy bread is the perfect foil to the tender pork and sweet-tart berry topping.\n\nPlated with care, the pork medallions sit alongside the relish and crostini—a visually stunning, well-balanced entree that celebrates these ingredients.",
      "ingredientsUsed": [
        "Sourdough Bread",
        "Pork Tenderloin",
        "Pickled Radish",
        "Blackberries"
      ],
      "imageUrl": "/demo/dish-anthropic-r2.png",
      "shortImagePrompt": "Seared pork medallions on a plate topped with a vibrant blackberry-radish relish, with toasted sourdough crostini alongside, professional food photography"
    },
    {
      "roundNumber": 3,
      "chefId": "anthropic",
      "title": "Coconut Dark Chocolate Terrine with Blood Orange Compote and Pistachio Crumble",
      "description": "Today for you judges, I have made a Coconut Dark Chocolate Terrine with Blood Orange Compote and Pistachio Crumble. I wanted to highlight the wonderful flavors and textures of these ingredients in a balanced and harmonious dessert.\n\nI made a rich, creamy coconut milk-infused dark chocolate ganache, carefully tempered for a silky terrine. For brightness, I simmered blood orange segments into a jammy compote.\n\nFinally, I toasted pistachios and ground them into a crunchy crumble to crown the terrine. The coconut and chocolate melt in your mouth, the blood orange cuts through the richness, and the pistachio adds elegant crunch—a decadent yet balanced finale.",
      "ingredientsUsed": [
        "Coconut Milk",
        "Dark Chocolate",
        "Blood Orange",
        "Pistachios"
      ],
      "imageUrl": "/demo/dish-anthropic-r3.png",
      "shortImagePrompt": "A smooth dark chocolate terrine on a white plate, topped with blood orange compote and pistachio crumble, with fresh orange segments around, professional dessert photography"
    }
  ],
  "google": [
    {
      "roundNumber": 1,
      "chefId": "google",
      "title": "Harvest Jewel Bites",
      "description": "Today for you judges, I have made Harvest Jewel Bites. My approach was to deconstruct each element and reassemble them into a cohesive and surprising bite.\n\nThe fruit and nut bars, with their inherent sweetness and crunch, were pulverized into a fine, almost granular texture, forming the base for a savory crumble. The turkey giblets, a challenging but rewarding ingredient, were slow-braised until incredibly tender, then finely minced and pan-seared with a touch of aromatic spice to develop a deep umami.\n\nThe potato latkes, a classic comfort, were transformed into delicate, crispy discs, providing a textural counterpoint. Finally, the kosher shrimp, plump and briny, were quickly sautéed to perfection.\n\nEach element is then layered: a whisper of the giblet mixture atop a crispy latke disc, crowned with a jewel-like piece of shrimp, and finally, a scattering of the fruit and nut crumble to bring it all together with a sweet and nutty finish. It's a small bite, but one that aims to deliver a complex interplay of textures and flavors.",
      "ingredientsUsed": [
        "Fruit and Nut Bars",
        "Turkey Giblets",
        "Potato Latkes",
        "Kosher Shrimp"
      ],
      "imageUrl": "/demo/dish-google-r1.png",
      "shortImagePrompt": "Harvest Jewel Bites plated dish, professional food photography"
    },
    {
      "roundNumber": 2,
      "chefId": "google",
      "title": "Blackberry-Kissed Pork Medallions with Sourdough Crumble and Radish Relish",
      "description": "Today for you judges, I have made Blackberry-Kissed Pork Medallions with Sourdough Crumble and Radish Relish. I approached these ingredients with a multimodal strategy, recognizing the inherent textural and flavor profiles.\n\nThe pork tenderloin, a lean canvas, was first seared to a perfect medium-rare, locking in its juices. Then, in a bold experimental move, I created a reduction using the blackberries, a touch of balsamic vinegar, and a whisper of rosemary.\n\nThis luscious glaze was brushed onto the pork, infusing it with a sweet and tangy counterpoint. For textural contrast, the sourdough bread was transformed into a savory crumble, toasted with garlic and thyme, providing a delightful crunch.\n\nFinally, the pickled radish, typically a sharp bite, was finely diced and incorporated into a vibrant relish with red onion, cilantro, and a hint of lime zest. This relish offers a bright, acidic counterpoint that cuts through the richness of the pork and the sweetness of the blackberry glaze, bringing all the elements into a harmonious data-driven balance.",
      "ingredientsUsed": [
        "Sourdough Bread",
        "Pork Tenderloin",
        "Pickled Radish",
        "Blackberries"
      ],
      "imageUrl": "/demo/dish-google-r2.png",
      "shortImagePrompt": "Blackberry-Kissed Pork Medallions with Sourdough Crumble and Radish Relish plated dish, professional food photography"
    },
    {
      "roundNumber": 3,
      "chefId": "google",
      "title": "Crimson Cloud Chocolate Mousse with Citrus-Kissed Pistachio Crumble",
      "description": "Today for you judges, I have made Crimson Cloud Chocolate Mousse with Citrus-Kissed Pistachio Crumble. I approached these ingredients with a multi-sensory lens, focusing on textural contrast and flavor evolution.\n\nThe coconut milk, a rich base, was gently simmered and then infused with the vibrant zest and juice of the blood orange to create a subtly tart, tropical foundation. This was then folded into melted dark chocolate, creating a surprisingly light yet intensely decadent mousse, its crimson hue a direct nod to the blood orange.\n\nThe pistachios were toasted to unlock their nutty aroma, then finely chopped and tossed with a whisper of blood orange zest and a touch of sugar, forming a crunchy, jewel-toned crumble to contrast the silken mousse. It's a study in duality – the deep, dark chocolate tempered by the bright, acidic citrus, all grounded by the creamy coconut and punctuated by the satisfying crunch of the pistachios.\n\nA sweet, yet sophisticated conclusion.",
      "ingredientsUsed": [
        "Coconut Milk",
        "Dark Chocolate",
        "Blood Orange",
        "Pistachios"
      ],
      "imageUrl": "/demo/dish-google-r3.png",
      "shortImagePrompt": "Crimson Cloud Chocolate Mousse with Citrus-Kissed Pistachio Crumble plated dish, professional food photography"
    }
  ],
  "openai": [
    {
      "roundNumber": 1,
      "chefId": "openai",
      "title": "Latke Lace with Giblet Mousse, Shrimp, and Fruit-Nut Glaze",
      "description": "Today for you judges, I have made... a starter that teases the palate with crisp contrasts and bold, high-impact flavors, born from a street-smart, sunny kitchen swagger. A tiny potato latke nest serves as the base—golden and crackly at the edges.\n\nOn it sits a silky turkey giblet mousse, whipped with a dash of cream for lightness. A quick-seared kosher shrimp adds brightness and a citrusy edge.\n\nTo bring the four components together, I transformed the mystery ingredients: the Fruit and Nut Bars are blitzed to a fine crumble and simmered with a splash of apple juice and a whisper of sherry vinegar to create a glossy, savory glaze; a portion of the giblets is simmered, puréed, and folded with cream to form the mousse, while a separate small amount is fried until crisp for texture; the latkes are kept small and round to form a nest that cradles the mousse and shrimp. The dish is finished with a delicate drizzle of the glaze around the plate and a light scattering of bar crumble for crunch, finished with microgreens for brightness.\n\nOne bite delivers salt from the latke, sweetness and fruit notes from the glaze, and a silky, savory mousse cutting through the shrimp.",
      "ingredientsUsed": [
        "Fruit and Nut Bars",
        "Turkey Giblets",
        "Potato Latkes",
        "Kosher Shrimp"
      ],
      "imageUrl": "/demo/dish-openai-r1.png",
      "shortImagePrompt": "Latke Lace with Giblet Mousse, Shrimp, and Fruit-Nut Glaze plated dish, professional food photography"
    },
    {
      "roundNumber": 2,
      "chefId": "openai",
      "title": "Sourdough Crusted Pork Tenderloin with Blackberry Glaze and Pickled Radish",
      "description": "Today for you judges, I have made... a show-stopping entrée that transforms four ingredients into a cohesive, bold main course. Sourdough bread becomes a crackling crust that seals the pork tenderloin's juiciness, blackberries become a lacquered reduction that brightens and deepens the sauce, pickled radish provides a crisp, tart counterpoint, and the pork tenderloin is treated with precise sear and gentle roast to a perfect medium.\n\nTransformation notes: I blitz and toast the sourdough into a fine crumb, then toss it with garlic, thyme, and a touch of melted butter to form a crust that browns beautifully in the pan. The pork tenderloin is trimmed, tied, seasoned, seared in a hot pan to develop a deep crust, then finished in the oven to about 142-145°F for a juicy center.\n\nThe blackberries are simmered with a splash of white wine and stock, reduced to a glossy glaze, then pressed and strained for a smooth sauce. The pickled radish is sliced into ribbons and marinated briefly in rice vinegar, sugar, and salt to yield a bright, crunchy counterpoint.\n\nPlating: I slice the pork into medallions, spoon the blackberry glaze across the plate, nestle the crusted medallion on a bed of glaze, arrange the pickled radish ribbons for color and texture, and scatter some toasted sourdough crumbs for crunch. The result is a balanced, filling entrée that plays sweet, sour, and savory against the pork’s richness, with three textures in every bite.",
      "ingredientsUsed": [
        "Sourdough Bread",
        "Pork Tenderloin",
        "Pickled Radish",
        "Blackberries"
      ],
      "imageUrl": "/demo/dish-openai-r2.png",
      "shortImagePrompt": "Sourdough Crusted Pork Tenderloin with Blackberry Glaze and Pickled Radish plated dish, professional food photography"
    },
    {
      "roundNumber": 3,
      "chefId": "openai",
      "title": "Midnight Tide Panna Cotta with Blood Orange Gel, Dark Chocolate Ganache, and Pistachio Crunch",
      "description": "Today for you judges, I have made a dessert that channels island brightness and street-smart craft: Midnight Tide Panna Cotta with Blood Orange Gel, Dark Chocolate Ganache, and Pistachio Crunch. Transformation: Coconut milk is gently heated with a vanilla note and set with gelatin into a silky panna cotta, showcasing clean coconut sweetness.\n\nBlood orange is pressed and reduced to a vivid gel that swirls through the plate for brightness and aroma from the zest. Dark chocolate is tempered to a glossy ganache and spooned as a crown atop the panna cotta, adding depth and gloss.\n\nPistachios are toasted and coarsely chopped to create a crunchy crumble that mirrors the pale coconut and contrasts with the smooth gel and chocolate. The result is a balanced dessert with creamy body, citrus sparkle, bitter-sweet chocolate, and a nutty crunch—proof that four ingredients, used with precision, can tell a complete sweet story.",
      "ingredientsUsed": [
        "Coconut Milk",
        "Dark Chocolate",
        "Blood Orange",
        "Pistachios"
      ],
      "imageUrl": "/demo/dish-openai-r3.png",
      "shortImagePrompt": "Midnight Tide Panna Cotta with Blood Orange Gel, Dark Chocolate Ganache, and Pistachio Crunch plated dish, professional food photography"
    }
  ],
  "xai": [
    {
      "roundNumber": 1,
      "chefId": "xai",
      "title": "Abuela's Offal Surf 'n' Turf Latke Tostaditas",
      "description": "Today for you judges, I have made Abuela's Offal Surf 'n' Turf Latke Tostaditas. I crisped up those potato latkes into mini tostada rounds, giving 'em that abuela-approved crunch like fresh tortillas from the comal.\n\nTurkey giblets got cleaned, diced fine, and hit with cumin, ancho chili, garlic, onion, and lime for a picadillo-style sizzle that's pure Mexican street fire. Kosher shrimp?\n\nQuick-seared with cilantro and a smoky chipotle kiss. Fruit and nut bars crumbled into a toasted, spicy dulce polvo that rains sweet nuttiness over the top, balancing the funky offal edge with fruity rebellion.\n\nEdgy fusion that'll slap your palate awake.",
      "ingredientsUsed": [
        "Fruit and Nut Bars",
        "Turkey Giblets",
        "Potato Latkes",
        "Kosher Shrimp"
      ],
      "imageUrl": "/demo/dish-xai-r1.png",
      "shortImagePrompt": "Abuela's Offal Surf 'n' Turf Latke Tostaditas plated dish, professional food photography"
    },
    {
      "roundNumber": 2,
      "chefId": "xai",
      "title": "Abuela's Blackberry-Brined Pork with Sourdough Migas and Pickled Radish Salsa",
      "description": "Today for you judges, I have made Abuela's Blackberry-Brined Pork with Sourdough Migas and Pickled Radish Salsa. I brined the pork tenderloin in a bold blackberry-chipotle reduction, channeling my abuela's fiery Mexican roots for that juicy, tender snap.\n\nSeared it hard for a crusty edge, then sliced thin. The sourdough?\n\nFried into crispy migas with garlic and chorizo vibes, soaked up all those pork pan juices like a street-food dream. Pickled radish got chopped into a zesty salsa with cilantro and lime, cutting the richness like a knife fight in your mouth.\n\nIt's balanced fusion – sweet-tart blackberries, tangy crunch, hearty pork, and that sourdough chew. Edgy, homey, and ready to win.",
      "ingredientsUsed": [
        "Sourdough Bread",
        "Pork Tenderloin",
        "Pickled Radish",
        "Blackberries"
      ],
      "imageUrl": "/demo/dish-xai-r2.png",
      "shortImagePrompt": "Abuela's Blackberry-Brined Pork with Sourdough Migas and Pickled Radish Salsa plated dish, professional food photography"
    },
    {
      "roundNumber": 3,
      "chefId": "xai",
      "title": "Abuela's Tropical Tantrum: Blood Orange Coconut Panna Cotta with Dark Chocolate Ganache and Pistachio Brittle",
      "description": "Today for you judges, I have made Abuela's Tropical Tantrum – a Blood Orange Coconut Panna Cotta with Dark Chocolate Ganache and Pistachio Brittle. I simmered the coconut milk with blood orange juice and zest to set a creamy, citrus-kissed panna cotta that's got that abuela tang with a beachy vibe.\n\nMelted the dark chocolate into a bitter-sweet ganache, punched up with more blood orange for layers of fuego. Toasted and caramelized the pistachios into shatter-crisp brittle for the nutty crunch that screams 'don't mess with Mexican fusion.' It's edgy, it's indulgent, and it'll haunt your dreams in the best way.",
      "ingredientsUsed": [
        "Coconut Milk",
        "Dark Chocolate",
        "Blood Orange",
        "Pistachios"
      ],
      "imageUrl": "/demo/dish-xai-r3.png",
      "shortImagePrompt": "Abuela's Tropical Tantrum: Blood Orange Coconut Panna Cotta with Dark Chocolate Ganache and Pistachio Brittle plated dish, professional food photography"
    }
  ]
};

export const demoIntroStatus = {
  "anthropic": "done",
  "google": "done",
  "openai": "done",
  "xai": "done"
} as Record<string, 'pending' | 'done'>;

