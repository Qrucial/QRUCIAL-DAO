# dockerfile Readme
Dockerfile installs cargo audit and syncs repos.

- [ ] TODO - Write some docs on how to properly execute it


## Warning
Inorder to keep the docker container runninf i had to make it listen to /dev/null
This is not ideal but, as far as i could find the only other way would be to run something else indefinitly. 
So do we have anything that should run here forever? some simple script to check on things?
