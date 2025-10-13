#install.packages("stargazer")

library(janitor)
library(dplyr)
library(tidyverse)
library(rsample)
library(sandwich)
library(lmtest)
library(ggplot2)
library(rvest)
library(stargazer)

url <- "https://www.basketball-reference.com/leagues/NBA_2024_per_game.html"
tables <- url %>%
  read_html() %>%
  html_table()
nba_per_game <- tables[[1]]
#delete "League Average" row at footer
nba_per_game <- nba_per_game[-nrow(nba_per_game), ]

url <- "https://www.basketball-reference.com/leagues/NBA_2024_advanced.html"
tables <- url %>%
  read_html() %>%
  html_table()
nba_advanced <- tables[[1]]
#delete "League Average" row at footer
nba_advanced <- nba_advanced[-nrow(nba_advanced), ]

#merge by player name and team (to account for trades, 2tm/3tm)
nba <- inner_join(nba_per_game, nba_advanced, by = c("Player", "Team"))

#just take features relevant to project
nba <- nba[, c("Player", "Team", "G.x", "MP.x", "Pos.x", "eFG%", "3PAr", "USG%", "3PA")]

#change column names
nba <- nba %>%
  rename("MPG" = "MP.x", "G" = "G.x", "Pos" = "Pos.x")

#probably need to remove duplicate players who played for multiple teams
#just need total season stats
nba <- nba %>%
  group_by(Player) %>%
  filter(Team == "2TM" | Team == "3TM" | n() == 1) %>% # keep 2TM/3TM if exists, else the only row
  ungroup()

#Filter out players who have less than 12 MPG, less than 25 games played, and at least 1 3PA
nba <- nba %>%
  filter(G >= 25, MPG >= 12, `3PA` >= 1)

# 8 players that have zero 3-point attempts, still include in dataset
nba[nba$`3PAr` == 0,]

summary(nba)

#Shows which positions tend to have higher efficiency or higher 3PAr
nba %>%
  group_by(Pos) %>%
  summarise(
    avg_eFG = mean(`eFG%`, na.rm = TRUE),
    avg_3PAr = mean(`3PAr`, na.rm = TRUE),
    n_players = n()
  ) %>%
  arrange(desc(avg_eFG))

# Histogram for eFG%
ggplot(nba, aes(x = `eFG%`)) +
  geom_histogram(binwidth = 0.015, fill = "steelblue", color = "white") +
  labs(title = "Distribution of Effective FG%", x = "eFG%", y = "Count")

# Histogram for 3PAr
ggplot(nba, aes(x = `3PAr`)) +
  geom_histogram(binwidth = 0.05, fill = "seagreen", color = "white") +
  labs(title = "Distribution of 3P Attempt Rate", x = "3PAr", y = "Count")

#basic scatterplot
ggplot(nba, aes(x = `3PAr`, y = `eFG%`)) +
  geom_point(color = "steelblue", alpha = 0.7) +
  geom_smooth(method = "lm", se = TRUE, color = "red", linewidth = 1) +
  labs(
    title = "Relationship Between Effective Field Goal Percentage and Three-Point Attempt Rate",
    x = "Three-Point Attempt Rate (3PAr)",
    y = "Effective Field Goal Percentage (eFG%)"
  ) +
  theme_minimal()

# position scatterplots
ggplot(nba, aes(x = `3PAr`, y = `eFG%`, color = Pos)) +
  geom_point(alpha = 0.6) +
  geom_smooth(method = "lm", se = TRUE) +
  facet_wrap(~ Pos) +
  labs(
    title = "eFG% vs. 3PAr by Position (2024 NBA Season)",
    x = "Three-Point Attempt Rate (3PAr)",
    y = "Effective Field Goal Percentage (eFG%)"
  ) +
  theme_minimal()

#split data into 30/70 exploration/confirmation sets if testing generalizability
#set.seed(123)
#split <- initial_split(nba, prop = 0.3)
#nba_exploration <- training(split)
#nba_confirmation <- testing(split)

#Summary tables
nba %>%
  tabyl(Pos) %>%
  arrange(desc(n)) %>%
  adorn_totals()

nba %>%
  summarise(
    mean_eFG = mean(`eFG%`, na.rm = TRUE),
    sd_eFG = sd(`eFG%`, na.rm = TRUE),
    mean_3PAr = mean(`3PAr`, na.rm = TRUE),
    sd_3PAr = sd(`3PAr`, na.rm = TRUE)
  )

# quadratic model
model_quad <- lm(`eFG%` ~ `3PAr` + I(`3PAr`^2) + `USG%` + MPG + Pos, data = nba)
summary(model_quad)

ggplot(nba, aes(x = `3PAr`, y = `eFG%`)) +
  geom_point(alpha = 0.6) +
  stat_smooth(method = "lm", formula = y ~ poly(x, 2), color = "red") +
  labs(title = "U-Shaped Relationship Between 3PAr and eFG%")


################

# MODELING

#Baseline
model1 <- lm(`eFG%` ~ `3PAr` + I(`3PAr`^2), data = nba)

#Comparison
model2 <- lm(`eFG%` ~ `3PAr` + I(`3PAr`^2) + `USG%` + MPG, data = nba)

#Further Comparison
model3 <- lm(`eFG%` ~ `3PAr` + I(`3PAr`^2) + `USG%` + MPG + Pos, data = nba)

#Further Comparison
model4 <- lm(`eFG%` ~ `3PAr` + I(`3PAr`^2) + Pos, data = nba)

cov1 <- vcovHC(model1, type = "HC1")
robust_se1 <- sqrt(diag(cov1))
cov2 <- vcovHC(model2, type = "HC1")
robust_se2 <- sqrt(diag(cov2))
cov3 <- vcovHC(model3, type = "HC1")
robust_se3 <- sqrt(diag(cov3))
cov4 <- vcovHC(model4, type = "HC1")
robust_se4 <- sqrt(diag(cov4))
stargazer(model1, model2, model3, model4, type = "text",
          se = list(robust_se1, robust_se2, robust_se3, robust_se4),
          title="Regression Results",
          covariate.labels = c("3P Attempt Rate", "3P Attempt Rate Squared", "Usage Rate", "Minutes per Game", "Power Forward", "Point Guard", "Small Forward", "Shooting Guard", "Constant"),
          dep.var.labels = "eFG% w/ robust std errors")
