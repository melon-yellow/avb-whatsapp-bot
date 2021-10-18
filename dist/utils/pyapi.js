/*
##########################################################################################################################
#                                                      PYTHON API CLASS                                                  #
##########################################################################################################################
*/
// Python API Class
export default class PyAPI {
  bot;
  conn;
  target;
  constructor(bot) {
    Object.defineProperty(this, 'bot', {
      get() {
        return bot;
      }
    });
    // Set Python API Address
    this.target = {
      addr: 'http://localhost:1516/i',
      auth: {
        user: this.api.config.auth.user,
        password: this.api.config.auth.passwd
      }
    };
    // Set Connection Status Object
    this.conn = undefined;
  }
  // Cycle Reference
  get api() {
    return this.bot.api;
  }
  get misc() {
    return this.bot.misc;
  }
  // Check Connection
  async link() {
    // test connection
    const [, requestError] = await this.api.reqs(this.target, null);
    const conn = !requestError;
    // check result
    if (this.conn !== conn) {
      const l1 = 'Connection with Python Established';
      const l2 = 'No Connection with Python';
      const log = conn ? l1 : l2;
      await this.bot.log(log);
      this.conn = conn;
      // Send Message to Admin
      await this.bot.sends('anthony', log, 'py_conn_status');
    }
    // return result
    return conn;
  }
  // Start Interface App
  async start() {
    try {
      const cycle = async () => {
        while (true) {
          await this.misc.sync.wait(1000);
          await this.link();
        }
      };
      cycle();
    } catch {
      return false;
    }
    // return success
    return true;
  }
}
