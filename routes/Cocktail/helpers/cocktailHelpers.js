/**
 * Calculates the difficulty level of a cocktail based on its ingredients and preparation
 * @param {Object} cocktail - The cocktail object from the database
 * @returns {string} - 'Beginner', 'Intermediate', or 'Advanced'
 */
const calculateDifficulty = cocktail => {
   // Count the number of ingredients
   let ingredientCount = 0;
   for (let i = 1; i <= 15; i++) {
      if (cocktail[`strIngredient${i}`]) {
         ingredientCount++;
      }
   }

   // Count the number of steps in instructions
   const instructions = cocktail.strInstructions || '';
   const stepCount = instructions.split(/[.!?]+/).filter(step => step.trim().length > 0).length;

   // Calculate total complexity score
   // Base score from ingredients (0.75 points per ingredient)
   // This reduces the weight of ingredient count
   let score = ingredientCount * 0.75;

   // Add points for steps (0.25 points per step)
   // This reduces the weight of step count
   score += stepCount * 0.25;

   // Add points for special techniques
   // Group techniques by complexity
   const basicTechniques = ['stir', 'shake', 'strain'];
   const intermediateTechniques = ['muddle', 'blend', 'garnish', 'rim'];
   const advancedTechniques = ['float', 'layer', 'flame'];

   // Add different weights for different technique complexities
   basicTechniques.forEach(technique => {
      if (instructions.toLowerCase().includes(technique)) {
         score += 0.5; // Basic techniques add less to the score
      }
   });

   intermediateTechniques.forEach(technique => {
      if (instructions.toLowerCase().includes(technique)) {
         score += 1; // Intermediate techniques add more
      }
   });

   advancedTechniques.forEach(technique => {
      if (instructions.toLowerCase().includes(technique)) {
         score += 1.5; // Advanced techniques add the most
      }
   });

   // Adjust thresholds for difficulty levels
   if (score <= 4) return 'Beginner';
   if (score <= 7) return 'Intermediate';
   return 'Advanced';
};

module.exports = {
   calculateDifficulty,
};
