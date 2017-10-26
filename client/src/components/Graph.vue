<script>
import {Line, mixins} from 'vue-chartjs'
export default {
  name: 'poyo',
  extends: Line,
  mixins: [mixins.reactiveProp],
  props: ['options', 'chartData'],
  created () {
    console.log('created')
  },
  mounted () {
    this.renderChart(this.data, this.options)
  }
}
</script>
