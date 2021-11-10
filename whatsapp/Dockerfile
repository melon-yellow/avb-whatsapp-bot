
FROM buildkite/puppeteer

##########################################################################################################################

RUN apt-get update
RUN apt-get upgrade

##########################################################################################################################
# Fix Version

# Install Curl
RUN apt-get install -y curl

# Install LTS Node-16
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
RUN apt-get install -y nodejs

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update
RUN apt-get install -y yarn

##########################################################################################################################

WORKDIR /usr/app

##########################################################################################################################
