-- CreateTable
CREATE TABLE "Cocktail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "baseSpirit" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prepTime" TEXT NOT NULL,
    "abv" TEXT NOT NULL,
    "glass" TEXT NOT NULL,
    "ice" TEXT NOT NULL,
    "garnish" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "originDate" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "tags" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "variations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CocktailIngredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cocktailId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "CocktailIngredient_cocktailId_fkey" FOREIGN KEY ("cocktailId") REFERENCES "Cocktail" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CocktailIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Instruction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cocktailId" INTEGER NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Instruction_cocktailId_fkey" FOREIGN KEY ("cocktailId") REFERENCES "Cocktail" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Syrup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Syrup',
    "ratio" TEXT NOT NULL,
    "sugarType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prepTime" TEXT NOT NULL,
    "shelfLife" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "yield" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "usedIn" TEXT NOT NULL,
    "variations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Infusion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Infusion',
    "baseSpirit" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prepTime" TEXT NOT NULL,
    "shelfLife" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "yield" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "usedIn" TEXT NOT NULL,
    "variations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Shrub" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Shrub',
    "base" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prepTime" TEXT NOT NULL,
    "shelfLife" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "yield" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "usedIn" TEXT NOT NULL,
    "variations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Liqueur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Liqueur',
    "baseSpirit" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prepTime" TEXT NOT NULL,
    "shelfLife" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "yield" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "usedIn" TEXT NOT NULL,
    "variations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OtherRecipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prepTime" TEXT,
    "shelfLife" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "yield" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "usedIn" TEXT NOT NULL,
    "variations" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Cocktail_name_key" ON "Cocktail"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "CocktailIngredient_cocktailId_idx" ON "CocktailIngredient"("cocktailId");

-- CreateIndex
CREATE UNIQUE INDEX "CocktailIngredient_cocktailId_ingredientId_key" ON "CocktailIngredient"("cocktailId", "ingredientId");

-- CreateIndex
CREATE INDEX "Instruction_cocktailId_idx" ON "Instruction"("cocktailId");

-- CreateIndex
CREATE UNIQUE INDEX "Instruction_cocktailId_stepNumber_key" ON "Instruction"("cocktailId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Syrup_name_key" ON "Syrup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Infusion_name_key" ON "Infusion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Shrub_name_key" ON "Shrub"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Liqueur_name_key" ON "Liqueur"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OtherRecipe_name_key" ON "OtherRecipe"("name");
