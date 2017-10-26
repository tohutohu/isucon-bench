<template>
  <div class="hello">
    <graph :height="120" :options="options" :chartData="graphData"></graph>
    <table class="ranking">
      <tr>
        <th>順位</th>
        <th>チーム名</th>
        <th>スコア</th>
      </tr>
      <tr v-for="(team, i) in getTeam">
        <td>{{i+1}}</td>
        <td>{{team.team}}</td>
        <td>{{team.score}}</td>
      </tr>
    </table>
  </div>
</template>

<script>
import graph from '@/components/Graph'
import chroma from 'chroma-js'
import axios from 'axios'
export default {
  name: 'HelloWorld',
  data () {
    return {
      data: [],
      graphStyle: {
        width: '100vw',
        height: '20vh',
        'max-height': '400px'
      },
      options: {
        hover: {
          mode: 'single'
        },
        title: {
          display: true,
          text: 'ランキング'
        },
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              tooltipFormat: 'hh:mm:ss',
              min: Date.now() - 300000000,
              max: Date.now()
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'points'
            },
            gridLines: {
              display: true
            },
            ticks: {
              beginAtZero: false
            }
          }]
        }
      }
    }
  },
  created () {
    axios.get('/api/all')
    .then(res => {
      console.log(res)
      this.data = res.data
      this.poi = this.graphData
    })
  },
  computed: {
    graphData () {
      this.options.max = Date.now() + 6000
      const res = {}
      let count = 0
      this.data.forEach(po => {
        if (!res[po.team]) {
          count++
          res[po.team] = {
            label: po.team,
            fill: false,
            data: []
          }
        }
        console.log(new Date(po.time).toDateString())
        res[po.team].data.push({
          fill: false,
          x: po.time,
          y: po.score
        })
      })

      return {
        type: 'line',
        datasets: Object.keys(res).map((key, i) => {
          const color = chroma(360 / count * i, 0.6, 0.4, 'hsl')
          res[key].pointBackgroundColor = color.alpha(0.8).css()
          res[key].borderColor = color.alpha(0.6).css()
          res[key].pointBorderColor = color.darken(0.4).alpha(0.8).css()
          res[key].pointHoverBackgroundColor = color.darken(2).alpha(0.8).css()
          return res[key]
        })
      }
    },
    getTeam () {
      const res = {}
      this.data.forEach(po => {
        if (!res[po.team]) {
          res[po.team] = {
            team: po.team,
            score: 0
          }
        }
        res[po.team].score = Math.max(res[po.team].score, po.score)
      })
      return Object.keys(res).map(key => res[key]).sort((a, b) => b.score - a.score)
    }
  },
  components: {
    graph: graph
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.ranking {
  margin: auto;
  margin-top: 20px;
  width: 80%;
  max-width: 700px;
  border-collapse: collapse;
}

.ranking tr th,
.ranking tr td {
  border: 1px solid #DDD;
  vertical-align: left;
}

.hello {
}
</style>
