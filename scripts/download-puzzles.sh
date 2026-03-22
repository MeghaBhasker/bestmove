#!/bin/bash
mkdir -p data
echo "Downloading Lichess puzzle database (~90MB compressed)..."
curl -L "https://database.lichess.org/lichess_db_puzzle.csv.zst" -o data/lichess_db_puzzle.csv.zst
echo "Decompressing..."
zstd -d data/lichess_db_puzzle.csv.zst -o data/lichess_db_puzzle.csv
echo "Removing compressed file..."
rm data/lichess_db_puzzle.csv.zst
echo "Done!"
wc -l data/lichess_db_puzzle.csv
