import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";
import { iconHTML } from "discourse-common/lib/icon-library";
import { schedule } from "@ember/runloop";

function buildBadge(solutions) {
  const icon = iconHTML('check-square');
  const count = document.createElement("span");
  count.innerText = solutions.count;

  const badge = document.createElement("a");
  badge.href = `/u/${solutions.username}/activity/solved`;
  badge.classList.add("poster-icon");
  badge.setAttribute("title", `${solutions.count} accepted answer${solutions.count > 1 ? 's' : ''}`);
  badge.insertAdjacentHTML('beforeend', icon);
  badge.insertAdjacentText('beforeend', ' ')
  badge.appendChild(count);
  return badge;
}

async function loadUserSolutions(username, displayedBadges) {
  console.log(username, 'getting solutions');
  const card = await ajax(`/u/${username}/card.json`);
  console.log(username, card);
  const count = card.user.accepted_answers;
  console.log(username, 'found', count, 'solutions');
  return { username, count };
}

function appendSolutions(solutions, decorator) {
  console.log('appending', solutions);
  if (solutions.count > 0) {
    const solutionsNode = buildBadge(solutions);
    const selector = `[data-post-id="${decorator.attrs.id}"] .poster-solutions-container`;
    schedule("afterRender", () => {
      const postContainer = document.querySelector(selector);
      postContainer.appendChild(solutionsNode);
    });
  }
}

export default {
  name: "discourse-post-badges",

  initialize() {
    withPluginApi("0.8.25", api => {
      const isMobileView = Discourse.Site.currentProp("mobileView");
      const location = isMobileView ? "before" : "after";

      api.decorateWidget(`poster-name:${location}`, decorator => {
        const username = decorator.attrs.username;
        loadUserSolutions(username).then(solutions =>
          appendSolutions(solutions, decorator)
        );

        return decorator.h("span.poster-solutions-container", {}, []);
      });
    });
  }
};

// vim: ft=javascript
