import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";
import { iconHTML } from "discourse-common/lib/icon-library";
import { schedule } from "@ember/runloop";

if (Node.prototype.replaceChildren === undefined) {
  Node.prototype.replaceChildren = function (...nodes) {
    while (this.lastChild) {
      this.removeChild(this.lastChild); 
    }
    if (nodes !== undefined) {
      this.append(nodes);
    }
  }
}

function buildBadge(solutions) {
  const icon = iconHTML('check-square');

  const badge = document.createElement("a");
  badge.href = `/u/${solutions.username}/activity/solved`;
  badge.classList.add("poster-icon");
  badge.setAttribute("title", `${solutions.count} accepted answer${solutions.count > 1 ? 's' : ''}`);
  badge.insertAdjacentText('beforeend', `${solutions.count} `)
  badge.insertAdjacentHTML('beforeend', icon);
  return badge;
}

async function loadUserSolutions(username, displayedBadges, cache = new Map()) {
  let card;
  if (cache.has(username)) {
    console.log('cache hit for', username);
    card = cache.get(username);
  } else {
    console.log('cache miss for', username);
    card = ajax(`/u/${username}/card.json`);
    cache.set(username, card);
    setTimeout(60 * 1000, () => cache.delete(username));
  }
  const count = (await card).user.accepted_answers;
  return { username, count };
}

function appendSolutions(solutions, decorator) {
  if (solutions.count > 0) {
    const solutionsNode = buildBadge(solutions);
    const selector = `[data-post-id="${decorator.attrs.id}"] .poster-solutions-container`;
    schedule("afterRender", () => {
      const postContainer = document.querySelector(selector);
      postContainer.replaceChildren(solutionsNode);
    });
  }
}

export default {
  name: "discourse-post-badges",

  initialize() {
    withPluginApi("0.8.25", api => {
      const isMobileView = Discourse.Site.currentProp("mobileView");
      const location = isMobileView ? "before" : "after";

      console.log('initialize');
      const cache = new Map();
      api.decorateWidget(`poster-name:${location}`, decorator => {
        const username = decorator.attrs.username;
        loadUserSolutions(username, cache).then(solutions =>
          appendSolutions(solutions, decorator)
        );

        return decorator.h("span.poster-solutions-container", {}, []);
      });
    });
  }
};

// vim: ft=javascript
