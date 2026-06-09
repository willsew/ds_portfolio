# William Seward — Data Science Portfolio

Senior data scientist with about five years of experience spanning applied AI, analytics, and AI governance. Currently a Master of Information and Data Science (MIDS) student at UC Berkeley while serving as a teaching assistant for graduate-level statistics. Most of my work has revolved around building AI-powered tools in a consulting environment while communicating technical concepts and responsible AI standards to non-technical stakeholders.

I grew from an AI Lab intern at PwC into a Data Scientist and then Senior Data Scientist, deepening my focus on practical AI applications and the policies needed to use them safely and responsibly. I'm looking for roles where he can combine hands-on data science with thoughtful oversight of how AI is deployed, ideally in teams that value both technical rigor and clear communication.

---

## Projects

### [Neo4j Flight Network Optimization](./neo4j-flight-network)
Modeled 67K+ global flight routes as a graph in Neo4j to analyze airport connectivity and optimize routing. Applied PageRank, centrality measures, and community detection to identify key hubs and map regional airline networks. Used Cypher for preprocessing and normalization prior to graph ingestion.

### [NBA 3-Point Attempt Rate & Shooting Efficiency](./nba-3pt-analysis)
Analyzed 2023–24 NBA player data to surface a U-shaped relationship between three-point attempt rate and shooting efficiency — players are most efficient as interior specialists or high-volume shooters, with a penalty for the in-between. Built in R.

### [Fungi Classification with Metadata Integration](./fungi-classification)
Built a multi-input neural network to classify wild fungi into taxonomic classes using the FungiCLEF 2025
dataset (6,391 observations, 12,015 images). Compared an image-only CNN against a multi-branch architecture
fusing image data with environmental metadata (elevation, habitat embeddings) via concatenation. Addressed
severe class imbalance across 33 taxa through augmentation and downsampling. Adding metadata more than
tripled CNN accuracy (2.4% → 8.2%); a feed-forward net on flattened image data topped all models at 11.1%,
suggesting tabular metadata carries strong taxonomic signal. Built in TensorFlow/Keras.

### [Spotify Track Popularity & Audio Features](./spotify-popularity)
Investigated the association between Spotify's danceability metric and track popularity across 26,230
deduplicated songs. Built baseline and multivariate OLS regression models in R with robust standard errors,
following a 30/70 exploration/confirmation split. Danceability was statistically significant but explained under
1% of popularity variance; adding instrumentalness and energy raised R² to 3.2%, with both carrying a negative
association with popularity. Also tested seven additional audio features for incremental explanatory value.
Built in R.

---

## Background

At PwC I was the first technical hire on the Responsible AI team, where I authored internal frameworks for AI risk across the model lifecycle and began peering into LLM evaluation and harm mitigation efforts. Before that I built and owned several ML systems in production:

- **Semantic search** — SBERT-based NLP pipeline for audit procedures and financial data (89% recall@10)
- **Company comparison** — scalable ML pipeline improving recall@10 by 90.3%
- **Accounting automation** — three patents for AI-assisted virtual assistant and consultant applications
- **Anomaly detection** — technical liaison using autoencoder, Isolation Forest, and SVDD

I'm currently a Teaching Assistant for Statistics for Data Science (DATASCI 203) at Berkeley.

---

## Skills

**Languages & libraries:** Python (pandas, numpy, scikit-learn, PyTorch), R, SQL (PostgreSQL), Cypher (Neo4j), MongoDB, Redis  
**ML focus:** NLP, semantic search, embeddings, LLMs, anomaly detection, recommendation systems  
**Cloud:** Azure, AWS, GCP

---

*Currently open to ML/data science roles. Reach me at wseward@ischool.berkeley.edu*
