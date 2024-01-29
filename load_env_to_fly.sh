#!/bin/bash

# Read each line in .env file
while IFS= read -r line
do
    # Skip if line is empty
    if [ -z "$line" ]; then
        continue
    fi

    # Split the line into name and value
    IFS='=' read -ra parts <<< "$line"

    # Use fly secrets set command to set the variable
    fly secrets set "${parts[0]}=${parts[1]}"

done < .env