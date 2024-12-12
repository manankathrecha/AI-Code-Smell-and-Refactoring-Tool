# This program fetches 11,257 code snippets from GitHub using the GitHub API and Github token.
# Although, due to the GitHub API rate limit of 5,000 requests per hour for authenticated users,
# I had to run the program in multiple batches to fetch all snippets successfully.
# Each batch processes a portion of the rows, and you might need to wait for the rate limit
# to reset before running the next batch.
#Combine the results from all batches into a single file once done.


import pandas as pd
import requests

# This is the path to the file
path = '/Users/sabrililac/Desktop/codesnippet.xlsx'
dataframe = pd.read_excel(path)  # This is to load all of the columns

# This will remove any columns that start with unnamed
dataframe = dataframe.loc[:, ~dataframe.columns.str.contains('^Unnamed')]

# This is the GitHub token that was created to be able to access GitHub links
github_token = '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'

def fetch(repository, CommitHash, path, start, lastline):
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3.raw'
    }
    #This is the constructed API URL to get file content at a specific commit
    url = f'https://api.github.com/repos/{repository}/contents/{path}?ref={CommitHash}'
    print(f"The program is now attempting to fetch from URL: {url}")  
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # This will show an error and will name its status
        content = response.text.splitlines()
        #This will extract the specific code snippets or lines
        return '\n'.join(content[start-1:lastline])
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch {path} in {repository} at {CommitHash}")
        print(f"There has been an error: {e}")
        return "The fetch has failed"  # This is the error message

# List to store the snippets for all rows
snippet_list = []

#This will iterate/go through over all rows for code snippets (0 to 11,257)
for _, row in dataframe.iterrows():
    repo = row['repository'].split(':')[-1].replace('.git', '')
    CommitHash = row['CommitHash']
    path = row['path']
    start = row['start']
    lastline = row['lastline']
    
    #This will fetch the code snippet
    code = fetch(repo, CommitHash, path, start, lastline)
    snippet_list.append(code)

#This will update the DataFrame with snippets
dataframe['snippet'] = snippet_list  

#This will save the updated code snippets into the Excel file
path = '/Users/sabrililac/Desktop/codesnippet_updated.xlsx'
dataframe.to_excel(path, index=False)

print("Updated file saved as:", path)
