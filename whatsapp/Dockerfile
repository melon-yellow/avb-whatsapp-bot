
FROM buildkite/puppeteer

##########################################################################################################################

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get update -y

##########################################################################################################################
# Fix Version

# Install Curl
RUN apt-get install -y curl

# Install LTS Node-16
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
RUN apt-get update -y

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -y
RUN apt-get install -y yarn

##########################################################################################################################

WORKDIR /usr/app

##########################################################################################################################
