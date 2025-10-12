# NBA 3-Point Attempt Rate and Shooting Efficiency Analysis
### Exploring the U-Shaped Relationship Between 3PAr and eFG%

This project investigates how NBA players’ **three-point attempt rate (3PAr)** relates to their **shooting efficiency (effective field goal percentage, eFG%)**. Using 2023–24 season data from [Basketball Reference](https://www.basketball-reference.com), the analysis finds evidence of a **U-shaped relationship** --> both low and high 3-point reliance are associated with higher efficiency, controlling for usage, minutes, and position.

---

## Overview

Over the past decade, the NBA has undergone a noticeable transformation toward perimeter-oriented play.

In lieu of this, my project seeks to address the question: ***What is the association between shot selection (three-point attempt rate) and player scoring efficiency?***

In this analysis, I:
- Scrape per-game and advanced player stats from Basketball Reference
- Clean and merge the two datasets
- Filter out players with < 25 games, < 12 minutes per game, and < 1 three-point attempt per game
- Explore descriptive patterns by position
- Visualize key relationships
- Test hypotheses using linear and quadratic regression models with robust standard errors

---

## Key Findings

- Higher 3-point attempt rate (3PAr) predicts higher shooting efficiency (eFG%), controlling for usage, minutes, and position.
- Evidence of a **U-shaped relationship**: both low- and high-volume 3-point shooters are more efficient compared to those with more balanced shot profiles.
- Guards and forwards show lower eFG% relative to centers, reflecting shot location and role differences.
- Model explains ~19% of variation in player field goal efficiency (Adj. R² = 0.19, p < 0.01).

> **Interpretation:** Efficiency peaks when players specialize, either as interior finishers or as volume 3-point shooters.

---

## Visuals

![U-Shaped Relationship](plots/u-shape.png)

### Regression Results (Robust SEs)
![Regression Results](plots/regression_table.png)

---

## Methods

| Step | Description |
|------|--------------|
| **1. Web Scraping** | Used `rvest` to import per-game and advanced stats tables from Basketball Reference |
| **2. Data Cleaning** | Removed duplicates and aggregated players with multi-team seasons (TOT row) |
| **3. Feature Selection** | Focused on variables relevant to shooting efficiency (`eFG%`, `3PAr`, `USG%`, `MPG`, `Pos`) |
| **4. Visualization** | Built exploratory plots using `ggplot2` |
| **5. Regression Modeling** | Used `lm()` with robust SEs (`sandwich` + `lmtest`), formatted output with `stargazer` |

---

## Tech Stack

- **Language:** R  
- **Libraries:** `tidyverse`, `rvest`, `dplyr`, `ggplot2`, `stargazer`, `sandwich`, `lmtest`, `janitor`  
- **Data Source:** [Basketball Reference (2023–24 season)](https://www.basketball-reference.com)

