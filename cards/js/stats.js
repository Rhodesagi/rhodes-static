/* RhodesCards — Stats + heatmap */

RC.loadStats = async function() {
    try {
        var data = await RC.api('GET', '/stats?days=90');
        document.getElementById('statsGrid').innerHTML =
            '<div class="stat-card"><div class="num">' + data.today.reviews + '</div><div class="label">Today</div></div>'
            + '<div class="stat-card"><div class="num">' + data.streak + '</div><div class="label">Day Streak</div></div>'
            + '<div class="stat-card"><div class="num">' + data.retention + '%</div><div class="label">Retention (30d)</div></div>'
            + '<div class="stat-card"><div class="num">' + data.total_reviews_30d + '</div><div class="label">Reviews (30d)</div></div>';

        var hm = document.getElementById('heatmap');
        var dailyMap = {};
        for (var i = 0; i < data.daily.length; i++) {
            dailyMap[data.daily[i].date] = data.daily[i].reviews;
        }

        var html = '';
        var today = new Date();
        for (var j = 89; j >= 0; j--) {
            var d = new Date(today);
            d.setDate(d.getDate() - j);
            var key = d.toISOString().split('T')[0];
            var count = dailyMap[key] || 0;
            var level = '';
            if (count > 0) level = count < 10 ? 'l1' : count < 30 ? 'l2' : count < 60 ? 'l3' : 'l4';
            html += '<div class="heatmap-cell ' + level + '" title="' + key + ': ' + count + ' reviews"></div>';
        }
        hm.innerHTML = html;
    } catch (e) { RC.toast(e.message, 'error'); }
};
