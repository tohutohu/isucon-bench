<script>
import {Line} from 'vue-chartjs'
export default {
  name: 'poyo',
  extends: Line,
  created () {
    console.log('created')
  },
  mounted () {
    this.renderChart({labels: ['a', 'b', 'c'], datasets: [{label: 'po', data: [1, 2, 3]}]}, {})
  }
}
</script>
